//
//  KSPurchaseManager.swift
//  KidSpeak
//
//  Native IAP Implementation using StoreKit 2
//

import Foundation
import StoreKit

@objc(KSPurchaseManager)
class KSPurchaseManager: NSObject {
  
  // Singleton instance
  static let shared = KSPurchaseManager()
  
  // Product IDs
  private let productIDs = [
    "com.kidspeak.mobile.weeklytrial1",
    "com.kidspeak.mobile.weekly1",
    "com.kidspeak.mobile.monthly1"
  ]
  
  // Available products
  private var products: [Product] = []
  
  // Transaction listener task
  private var transactionListener: Task<Void, Error>? = nil
  
  // MARK: - Initialization
  
  override init() {
    super.init()
    startTransactionListener()
  }
  
  deinit {
    transactionListener?.cancel()
  }
  
  // MARK: - Transaction Listener
  
  private func startTransactionListener() {
    transactionListener = Task {
      for await result in Transaction.updates {
        if case .verified(let transaction) = result {
          // Transaction is verified by StoreKit
          await transaction.finish()
        }
      }
    }
  }
  
  // MARK: - React Native Bridge Methods
  
  @objc
  func initialize(_ resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task {
      do {
        // Fetch products from App Store
        products = try await Product.products(for: productIDs)
        
        let productsData = products.map { product in
          return [
            "id": product.id,
            "displayName": product.displayName,
            "displayPrice": product.displayPrice,
            "price": product.price,
            "description": product.description
          ]
        }
        
        resolve(productsData)
      } catch {
        reject("INIT_ERROR", "Failed to initialize IAP: \(error.localizedDescription)", error)
      }
    }
  }
  
  @objc
  func purchaseProduct(_ productId: String,
                       resolver resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task {
      guard let product = products.first(where: { $0.id == productId }) else {
        reject("PRODUCT_NOT_FOUND", "Product not found: \(productId)", nil)
        return
      }
      
      do {
        // Start purchase
        let result = try await product.purchase()
        
        switch result {
        case .success(let verification):
          // Purchase successful
          switch verification {
          case .verified(let transaction):
            // Transaction is verified by StoreKit
            await transaction.finish()
            
            let purchaseData = [
              "productId": transaction.productID,
              "transactionId": String(transaction.id),
              "purchaseDate": transaction.purchaseDate.timeIntervalSince1970,
              "expirationDate": transaction.expirationDate?.timeIntervalSince1970 ?? 0
            ] as [String : Any]
            
            resolve(purchaseData)
            
          case .unverified(let transaction, let error):
            // Transaction failed verification
            await transaction.finish()
            reject("VERIFICATION_FAILED", "Transaction verification failed: \(error)", nil)
          }
          
        case .userCancelled:
          reject("USER_CANCELLED", "User cancelled the purchase", nil)
          
        case .pending:
          reject("PENDING", "Purchase is pending approval", nil)
          
        @unknown default:
          reject("UNKNOWN_ERROR", "Unknown purchase result", nil)
        }
      } catch {
        reject("PURCHASE_ERROR", "Purchase failed: \(error.localizedDescription)", error)
      }
    }
  }
  
  @objc
  func restorePurchases(_ resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task {
      do {
        // Sync with App Store
        try await AppStore.sync()
        
        var restoredPurchases: [[String: Any]] = []
        
        // Get all transactions
        for await result in Transaction.currentEntitlements {
          if case .verified(let transaction) = result {
            // Check if subscription is active
            if transaction.expirationDate ?? Date() > Date() {
              let purchaseData = [
                "productId": transaction.productID,
                "transactionId": String(transaction.id),
                "purchaseDate": transaction.purchaseDate.timeIntervalSince1970,
                "expirationDate": transaction.expirationDate?.timeIntervalSince1970 ?? 0
              ] as [String : Any]
              
              restoredPurchases.append(purchaseData)
            }
          }
        }
        
        resolve([
          "success": true,
          "purchases": restoredPurchases,
          "count": restoredPurchases.count
        ])
      } catch {
        reject("RESTORE_ERROR", "Failed to restore purchases: \(error.localizedDescription)", error)
      }
    }
  }
  
  @objc
  func checkActiveSubscription(_ resolve: @escaping RCTPromiseResolveBlock,
                                rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task {
      var hasActiveSubscription = false
      var activeProductId: String? = nil
      
      // Check all current entitlements
      for await result in Transaction.currentEntitlements {
        if case .verified(let transaction) = result {
          // Check if subscription is active and not expired
          if transaction.expirationDate ?? Date() > Date() {
            hasActiveSubscription = true
            activeProductId = transaction.productID
            break
          }
        }
      }
      
      resolve([
        "hasActive": hasActiveSubscription,
        "productId": activeProductId
      ])
    }
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}

