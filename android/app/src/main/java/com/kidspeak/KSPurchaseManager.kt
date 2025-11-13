package com.kidspeak

import android.app.Activity
import com.android.billingclient.api.*
import com.facebook.react.bridge.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class KSPurchaseManager(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext), PurchasesUpdatedListener {

    private var billingClient: BillingClient? = null
    private val productIds = listOf(
        "com.kidspeak.mobile.weeklytrial1",
        "com.kidspeak.mobile.weekly1",
        "com.kidspeak.mobile.monthly1"
    )
    private var products: List<ProductDetails> = emptyList()
    
    override fun getName(): String = "KSPurchaseManager"

    init {
        initializeBillingClient()
    }

    private fun initializeBillingClient() {
        billingClient = BillingClient.newBuilder(reactApplicationContext)
            .setListener(this)
            .enablePendingPurchases()
            .build()
    }

    @ReactMethod
    fun initialize(promise: Promise) {
        billingClient?.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    // Query products
                    queryProducts(promise)
                } else {
                    promise.reject(
                        "INIT_ERROR",
                        "Billing client setup failed: ${billingResult.debugMessage}"
                    )
                }
            }

            override fun onBillingServiceDisconnected() {
                // Try to reconnect
                initializeBillingClient()
            }
        })
    }

    private fun queryProducts(promise: Promise) {
        val productList = productIds.map { productId ->
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(productId)
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        }

        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(productList)
            .build()

        billingClient?.queryProductDetailsAsync(params) { billingResult, productDetailsList ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                products = productDetailsList
                
                val productsArray = Arguments.createArray()
                productDetailsList.forEach { product ->
                    val productMap = Arguments.createMap().apply {
                        putString("id", product.productId)
                        putString("displayName", product.name)
                        putString("description", product.description)
                        
                        product.subscriptionOfferDetails?.firstOrNull()?.let { offer ->
                            offer.pricingPhases.pricingPhaseList.firstOrNull()?.let { phase ->
                                putString("displayPrice", phase.formattedPrice)
                                putDouble("price", phase.priceAmountMicros / 1000000.0)
                            }
                        }
                    }
                    productsArray.pushMap(productMap)
                }
                
                promise.resolve(productsArray)
            } else {
                promise.reject(
                    "QUERY_ERROR",
                    "Failed to query products: ${billingResult.debugMessage}"
                )
            }
        }
    }

    @ReactMethod
    fun purchaseProduct(productId: String, promise: Promise) {
        val activity: Activity? = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity not available")
            return
        }

        val product = products.firstOrNull { it.productId == productId }
        if (product == null) {
            promise.reject("PRODUCT_NOT_FOUND", "Product not found: $productId")
            return
        }

        val offerToken = product.subscriptionOfferDetails?.firstOrNull()?.offerToken
        if (offerToken == null) {
            promise.reject("NO_OFFER", "No offer available for product")
            return
        }

        val productDetailsParams = BillingFlowParams.ProductDetailsParams.newBuilder()
            .setProductDetails(product)
            .setOfferToken(offerToken)
            .build()

        val billingFlowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(listOf(productDetailsParams))
            .build()

        // Store promise for later use in onPurchasesUpdated
        pendingPromise = promise

        val result = billingClient?.launchBillingFlow(activity, billingFlowParams)
        if (result?.responseCode != BillingClient.BillingResponseCode.OK) {
            pendingPromise = null
            promise.reject(
                "LAUNCH_ERROR",
                "Failed to launch billing flow: ${result?.debugMessage}"
            )
        }
    }

    private var pendingPromise: Promise? = null

    override fun onPurchasesUpdated(
        billingResult: BillingResult,
        purchases: MutableList<Purchase>?
    ) {
        val promise = pendingPromise ?: return
        pendingPromise = null

        when (billingResult.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                purchases?.forEach { purchase ->
                    if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
                        // Acknowledge purchase
                        acknowledgePurchase(purchase, promise)
                    }
                }
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> {
                promise.reject("USER_CANCELLED", "User cancelled the purchase")
            }
            else -> {
                promise.reject(
                    "PURCHASE_ERROR",
                    "Purchase failed: ${billingResult.debugMessage}"
                )
            }
        }
    }

    private fun acknowledgePurchase(purchase: Purchase, promise: Promise) {
        if (purchase.isAcknowledged) {
            resolvePurchase(purchase, promise)
            return
        }

        val params = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(purchase.purchaseToken)
            .build()

        billingClient?.acknowledgePurchase(params) { billingResult ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                resolvePurchase(purchase, promise)
            } else {
                promise.reject(
                    "ACKNOWLEDGE_ERROR",
                    "Failed to acknowledge purchase: ${billingResult.debugMessage}"
                )
            }
        }
    }

    private fun resolvePurchase(purchase: Purchase, promise: Promise) {
        val purchaseMap = Arguments.createMap().apply {
            putString("productId", purchase.products.firstOrNull() ?: "")
            putString("transactionId", purchase.orderId ?: "")
            putDouble("purchaseDate", purchase.purchaseTime.toDouble())
            putString("purchaseToken", purchase.purchaseToken)
        }
        promise.resolve(purchaseMap)
    }

    @ReactMethod
    fun restorePurchases(promise: Promise) {
        val params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.SUBS)
            .build()

        billingClient?.queryPurchasesAsync(params) { billingResult, purchases ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                val purchasesArray = Arguments.createArray()
                
                purchases.forEach { purchase ->
                    if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
                        val purchaseMap = Arguments.createMap().apply {
                            putString("productId", purchase.products.firstOrNull() ?: "")
                            putString("transactionId", purchase.orderId ?: "")
                            putDouble("purchaseDate", purchase.purchaseTime.toDouble())
                            putString("purchaseToken", purchase.purchaseToken)
                        }
                        purchasesArray.pushMap(purchaseMap)
                    }
                }

                val resultMap = Arguments.createMap().apply {
                    putBoolean("success", true)
                    putArray("purchases", purchasesArray)
                    putInt("count", purchases.size)
                }
                promise.resolve(resultMap)
            } else {
                promise.reject(
                    "RESTORE_ERROR",
                    "Failed to restore purchases: ${billingResult.debugMessage}"
                )
            }
        }
    }

    @ReactMethod
    fun checkActiveSubscription(promise: Promise) {
        val params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.SUBS)
            .build()

        billingClient?.queryPurchasesAsync(params) { billingResult, purchases ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                val activePurchase = purchases.firstOrNull { 
                    it.purchaseState == Purchase.PurchaseState.PURCHASED 
                }
                
                val resultMap = Arguments.createMap().apply {
                    putBoolean("hasActive", activePurchase != null)
                    if (activePurchase != null) {
                        putString("productId", activePurchase.products.firstOrNull() ?: "")
                    } else {
                        putNull("productId")
                    }
                }
                promise.resolve(resultMap)
            } else {
                promise.reject(
                    "CHECK_ERROR",
                    "Failed to check subscription: ${billingResult.debugMessage}"
                )
            }
        }
    }
}

