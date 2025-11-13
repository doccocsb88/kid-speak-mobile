package com.kidspeak.mobile

import android.app.Activity
import com.android.billingclient.api.*
import com.facebook.react.bridge.*
import android.util.Log

class KSPurchaseManager(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext), PurchasesUpdatedListener {

    private var billingClient: BillingClient? = null
    private var isBillingClientReady = false
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
        if (billingClient == null) {
            billingClient = BillingClient.newBuilder(reactApplicationContext)
                .setListener(this)
                .enablePendingPurchases()
                .build()
            Log.d("KSPurchaseManager", "Billing client created")
        }
    }

    @ReactMethod
    fun initialize(promise: Promise) {
        val client = billingClient
        if (client == null) {
            Log.e("KSPurchaseManager", "Billing client is null, recreating...")
            initializeBillingClient()
            promise.reject(
                "INIT_ERROR",
                "Billing client not initialized. Please try again."
            )
            return
        }

        if (isBillingClientReady) {
            // Already connected, just query products
            Log.d("KSPurchaseManager", "Billing client already ready, querying products")
            queryProducts(promise)
            return
        }

        Log.d("KSPurchaseManager", "Starting billing client connection...")
        Log.d("KSPurchaseManager", "Application context: ${reactApplicationContext.packageName}")
        
        try {
            client.startConnection(object : BillingClientStateListener {
                override fun onBillingSetupFinished(billingResult: BillingResult) {
                    val responseCode = billingResult.responseCode
                    val debugMessage = billingResult.debugMessage
                    
                    Log.d("KSPurchaseManager", "Billing setup finished. Response code: $responseCode, Message: $debugMessage")
                    
                    when (responseCode) {
                        BillingClient.BillingResponseCode.OK -> {
                            Log.d("KSPurchaseManager", "Billing client connected successfully")
                            isBillingClientReady = true
                            // Query products
                            queryProducts(promise)
                        }
                        BillingClient.BillingResponseCode.BILLING_UNAVAILABLE -> {
                            Log.e("KSPurchaseManager", "Billing unavailable: $debugMessage")
                            Log.e("KSPurchaseManager", "This usually means:")
                            Log.e("KSPurchaseManager", "1. Google Play Services is not available on this device/emulator")
                            Log.e("KSPurchaseManager", "2. App is not uploaded to Play Store (internal testing required)")
                            Log.e("KSPurchaseManager", "3. Device/emulator doesn't have Google Play Store")
                            isBillingClientReady = false
                            promise.reject(
                                "INIT_ERROR",
                                "Billing service unavailable. Please ensure:\n" +
                                "1. Google Play Services is installed\n" +
                                "2. App is uploaded to Play Store (internal testing)\n" +
                                "3. Testing on device with Google Play Store\n\n" +
                                "Debug: $debugMessage"
                            )
                        }
                        BillingClient.BillingResponseCode.SERVICE_DISCONNECTED -> {
                            Log.e("KSPurchaseManager", "Billing service disconnected: $debugMessage")
                            isBillingClientReady = false
                            promise.reject(
                                "INIT_ERROR",
                                "Billing service disconnected. Please try again: $debugMessage"
                            )
                        }
                        BillingClient.BillingResponseCode.SERVICE_UNAVAILABLE -> {
                            Log.e("KSPurchaseManager", "Billing service unavailable: $debugMessage")
                            isBillingClientReady = false
                            promise.reject(
                                "INIT_ERROR",
                                "Billing service is temporarily unavailable. Please try again later: $debugMessage"
                            )
                        }
                        else -> {
                            Log.e("KSPurchaseManager", "Billing setup failed: Response code=$responseCode, Message=$debugMessage")
                            isBillingClientReady = false
                            promise.reject(
                                "INIT_ERROR",
                                "Failed to initialize payment system (Code: $responseCode): $debugMessage"
                            )
                        }
                    }
                }

                override fun onBillingServiceDisconnected() {
                    Log.w("KSPurchaseManager", "Billing service disconnected")
                    isBillingClientReady = false
                    // Try to reconnect
                    initializeBillingClient()
                }
            })
        } catch (e: Exception) {
            Log.e("KSPurchaseManager", "Exception starting billing connection", e)
            isBillingClientReady = false
            promise.reject(
                "INIT_ERROR",
                "Exception initializing billing: ${e.message}"
            )
        }
    }

    private fun queryProducts(promise: Promise) {
        val client = billingClient
        if (client == null || !isBillingClientReady) {
            Log.e("KSPurchaseManager", "Cannot query products: billing client not ready")
            promise.reject(
                "QUERY_ERROR",
                "Billing client is not ready. Please initialize first."
            )
            return
        }

        val productList = productIds.map { productId ->
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(productId)
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        }

        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(productList)
            .build()

        Log.d("KSPurchaseManager", "Querying products: ${productIds.joinToString()}")
        client.queryProductDetailsAsync(params) { billingResult, productDetailsList ->
            when (billingResult.responseCode) {
                BillingClient.BillingResponseCode.OK -> {
                    products = productDetailsList
                    Log.d("KSPurchaseManager", "Found ${productDetailsList.size} products")
                    
                    val productsArray = Arguments.createArray()
                    productDetailsList.forEach { product ->
                        Log.d("KSPurchaseManager", "Product: ${product.productId}, Name: ${product.name}")
                        Log.d("KSPurchaseManager", "  Offers: ${product.subscriptionOfferDetails?.size ?: 0}")
                        
                        val productMap = Arguments.createMap().apply {
                            putString("id", product.productId)
                            putString("displayName", product.name)
                            putString("description", product.description)
                            
                            product.subscriptionOfferDetails?.firstOrNull()?.let { offer ->
                                Log.d("KSPurchaseManager", "  Offer token: ${offer.offerToken}")
                                offer.pricingPhases.pricingPhaseList.firstOrNull()?.let { phase ->
                                    putString("displayPrice", phase.formattedPrice)
                                    putDouble("price", phase.priceAmountMicros / 1000000.0)
                                    Log.d("KSPurchaseManager", "  Price: ${phase.formattedPrice}")
                                }
                            }
                        }
                        productsArray.pushMap(productMap)
                    }
                    
                    Log.d("KSPurchaseManager", "Products cached successfully. Ready for purchase.")
                    promise.resolve(productsArray)
                }
                else -> {
                    Log.e("KSPurchaseManager", "Failed to query products: ${billingResult.responseCode} - ${billingResult.debugMessage}")
                    promise.reject(
                        "QUERY_ERROR",
                        "Failed to query products: ${billingResult.debugMessage}"
                    )
                }
            }
        }
    }

    @ReactMethod
    fun purchaseProduct(productId: String, promise: Promise) {
        val client = billingClient
        if (client == null || !isBillingClientReady) {
            Log.e("KSPurchaseManager", "Cannot purchase: billing client not ready")
            promise.reject("NOT_INITIALIZED", "Billing client is not ready. Please initialize first.")
            return
        }

        val activity: Activity? = reactApplicationContext.currentActivity
        if (activity == null) {
            Log.e("KSPurchaseManager", "Cannot purchase: activity not available")
            promise.reject("NO_ACTIVITY", "Activity not available")
            return
        }

        Log.d("KSPurchaseManager", "Attempting to purchase product: $productId")
        Log.d("KSPurchaseManager", "Available products count: ${products.size}")
        Log.d("KSPurchaseManager", "Available product IDs: ${products.map { it.productId }.joinToString()}")

        val product = products.firstOrNull { it.productId == productId }
        if (product == null) {
            Log.e("KSPurchaseManager", "Product not found in cached products: $productId")
            Log.e("KSPurchaseManager", "This might mean products were not loaded properly")
            promise.reject("PRODUCT_NOT_FOUND", "Product not found: $productId. Please try refreshing the subscription plans.")
            return
        }

        Log.d("KSPurchaseManager", "Found product: ${product.productId}, Name: ${product.name}")
        
        val subscriptionOffers = product.subscriptionOfferDetails
        Log.d("KSPurchaseManager", "Subscription offers count: ${subscriptionOffers?.size ?: 0}")
        
        if (subscriptionOffers.isNullOrEmpty()) {
            Log.e("KSPurchaseManager", "Product has no subscription offers: $productId")
            promise.reject("NO_OFFER", "No subscription offer available for this product. Please check Play Console configuration.")
            return
        }

        val offerToken = subscriptionOffers.firstOrNull()?.offerToken
        if (offerToken.isNullOrEmpty()) {
            Log.e("KSPurchaseManager", "Offer token is null or empty for product: $productId")
            promise.reject("NO_OFFER", "No valid offer token available for product")
            return
        }

        Log.d("KSPurchaseManager", "Using offer token: $offerToken")

        val productDetailsParams = BillingFlowParams.ProductDetailsParams.newBuilder()
            .setProductDetails(product)
            .setOfferToken(offerToken)
            .build()

        val billingFlowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(listOf(productDetailsParams))
            .build()

        // Store promise for later use in onPurchasesUpdated
        pendingPromise = promise

        Log.d("KSPurchaseManager", "Launching billing flow...")
        val result = client.launchBillingFlow(activity, billingFlowParams)
        
        Log.d("KSPurchaseManager", "Billing flow launch result: Response code=${result.responseCode}, Message=${result.debugMessage}")
        
        if (result.responseCode != BillingClient.BillingResponseCode.OK) {
            pendingPromise = null
            val errorMessage = when (result.responseCode) {
                BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> "You already own this subscription"
                BillingClient.BillingResponseCode.ITEM_UNAVAILABLE -> "This subscription is not available"
                BillingClient.BillingResponseCode.SERVICE_DISCONNECTED -> "Billing service disconnected. Please try again"
                BillingClient.BillingResponseCode.SERVICE_UNAVAILABLE -> "Billing service temporarily unavailable"
                BillingClient.BillingResponseCode.BILLING_UNAVAILABLE -> "Billing is not available on this device"
                else -> result.debugMessage ?: "Unknown error"
            }
            Log.e("KSPurchaseManager", "Failed to launch billing flow: $errorMessage")
            promise.reject(
                "LAUNCH_ERROR",
                "Failed to launch billing flow: $errorMessage"
            )
        } else {
            Log.d("KSPurchaseManager", "Billing flow launched successfully, waiting for user response...")
        }
    }

    private var pendingPromise: Promise? = null

    override fun onPurchasesUpdated(
        billingResult: BillingResult,
        purchases: MutableList<Purchase>?
    ) {
        val promise = pendingPromise ?: return
        pendingPromise = null

        val responseCode = billingResult.responseCode
        val debugMessage = billingResult.debugMessage
        
        Log.d("KSPurchaseManager", "onPurchasesUpdated called: Response code=$responseCode, Message=$debugMessage")
        Log.d("KSPurchaseManager", "Purchases count: ${purchases?.size ?: 0}")

        when (responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                val purchasedItems = purchases?.filter { 
                    it.purchaseState == Purchase.PurchaseState.PURCHASED 
                } ?: emptyList()
                
                Log.d("KSPurchaseManager", "Purchased items count: ${purchasedItems.size}")
                
                if (purchasedItems.isEmpty()) {
                    Log.e("KSPurchaseManager", "No purchased items found in OK response")
                    promise.reject(
                        "PURCHASE_ERROR",
                        "No valid purchases found"
                    )
                    return
                }
                
                // Process the first purchase (typically only one for subscriptions)
                val purchase = purchasedItems.first()
                Log.d("KSPurchaseManager", "Processing purchase: Product=${purchase.products.firstOrNull()}, OrderId=${purchase.orderId}")
                acknowledgePurchase(purchase, promise)
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> {
                Log.d("KSPurchaseManager", "User cancelled the purchase")
                promise.reject("USER_CANCELLED", "User cancelled the purchase")
            }
            BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> {
                Log.e("KSPurchaseManager", "Item already owned")
                promise.reject(
                    "PURCHASE_ERROR",
                    "You already own this subscription"
                )
            }
            BillingClient.BillingResponseCode.ITEM_UNAVAILABLE -> {
                Log.e("KSPurchaseManager", "Item unavailable (Response code 4): $debugMessage")
                Log.e("KSPurchaseManager", "This usually means:")
                Log.e("KSPurchaseManager", "1. Product is not activated/published in Play Console")
                Log.e("KSPurchaseManager", "2. App is not uploaded to Play Store internal testing")
                Log.e("KSPurchaseManager", "3. Subscription base plan is not activated")
                Log.e("KSPurchaseManager", "4. Product ID mismatch between code and Play Console")
                promise.reject(
                    "PURCHASE_ERROR",
                    "The item you were attempting to purchase could not be found.\n\n" +
                    "This usually means the product is not available for purchase. Please ensure:\n" +
                    "1. Product is activated and published in Play Console\n" +
                    "2. App is uploaded to Play Store (internal testing)\n" +
                    "3. Subscription base plan is activated\n" +
                    "4. Testing with correct Google account\n\n" +
                    "Debug: Response code=4 (ITEM_UNAVAILABLE)"
                )
            }
            else -> {
                Log.e("KSPurchaseManager", "Purchase failed: Response code=$responseCode, Message=$debugMessage")
                promise.reject(
                    "PURCHASE_ERROR",
                    "Purchase failed (Code: $responseCode): $debugMessage"
                )
            }
        }
    }

    private fun acknowledgePurchase(purchase: Purchase, promise: Promise) {
        val client = billingClient
        if (client == null) {
            promise.reject("NOT_INITIALIZED", "Billing client is not available")
            return
        }

        if (purchase.isAcknowledged) {
            resolvePurchase(purchase, promise)
            return
        }

        val params = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(purchase.purchaseToken)
            .build()

        client.acknowledgePurchase(params) { billingResult ->
            when (billingResult.responseCode) {
                BillingClient.BillingResponseCode.OK -> {
                    resolvePurchase(purchase, promise)
                }
                else -> {
                    promise.reject(
                        "ACKNOWLEDGE_ERROR",
                        "Failed to acknowledge purchase: ${billingResult.debugMessage}"
                    )
                }
            }
        }
    }

    private fun resolvePurchase(purchase: Purchase, promise: Promise) {
        // Calculate expiration date (subscriptions typically last 1 week or 1 month)
        // For now, we'll set it to 0 if not available (similar to iOS handling)
        // In production, you might want to parse this from purchase details
        val expirationDate = 0.0 // Will be updated when we have subscription period info
        
        val purchaseMap = Arguments.createMap().apply {
            putString("productId", purchase.products.firstOrNull() ?: "")
            putString("transactionId", purchase.orderId ?: purchase.purchaseToken)
            putDouble("purchaseDate", purchase.purchaseTime.toDouble() / 1000.0) // Convert to seconds (iOS uses seconds)
            putDouble("expirationDate", expirationDate) // Match iOS format
        }
        promise.resolve(purchaseMap)
    }

    @ReactMethod
    fun restorePurchases(promise: Promise) {
        val client = billingClient
        if (client == null || !isBillingClientReady) {
            promise.reject("NOT_INITIALIZED", "Billing client is not ready. Please initialize first.")
            return
        }

        val params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.SUBS)
            .build()

        client.queryPurchasesAsync(params) { billingResult, purchases ->
            when (billingResult.responseCode) {
                BillingClient.BillingResponseCode.OK -> {
                    val purchasesArray = Arguments.createArray()
                    
                    purchases.forEach { purchase ->
                        if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
                            val purchaseMap = Arguments.createMap().apply {
                                putString("productId", purchase.products.firstOrNull() ?: "")
                                putString("transactionId", purchase.orderId ?: purchase.purchaseToken)
                                putDouble("purchaseDate", purchase.purchaseTime.toDouble() / 1000.0) // Convert to seconds
                                putDouble("expirationDate", 0.0) // Match iOS format
                            }
                            purchasesArray.pushMap(purchaseMap)
                        }
                    }

                    val resultMap = Arguments.createMap().apply {
                        putBoolean("success", true)
                        putArray("purchases", purchasesArray)
                        putInt("count", purchasesArray.size())
                    }
                    promise.resolve(resultMap)
                }
                else -> {
                    promise.reject(
                        "RESTORE_ERROR",
                        "Failed to restore purchases: ${billingResult.debugMessage}"
                    )
                }
            }
        }
    }

    @ReactMethod
    fun checkActiveSubscription(promise: Promise) {
        val client = billingClient
        if (client == null || !isBillingClientReady) {
            promise.reject("NOT_INITIALIZED", "Billing client is not ready. Please initialize first.")
            return
        }

        val params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.SUBS)
            .build()

        client.queryPurchasesAsync(params) { billingResult, purchases ->
            when (billingResult.responseCode) {
                BillingClient.BillingResponseCode.OK -> {
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
                }
                else -> {
                    promise.reject(
                        "CHECK_ERROR",
                        "Failed to check subscription: ${billingResult.debugMessage}"
                    )
                }
            }
        }
    }
}

