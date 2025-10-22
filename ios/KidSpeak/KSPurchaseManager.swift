//
//  KSPurchaseManager.swift
//  KidSpeak
//
//  Native IAP Implementation using StoreKit 2
//

import Foundation
import StoreKit

@objc(KSPurchaseManager)
class KSPurchaseManager: RCTEventEmitter {
  
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
          await transaction.finish()
        }
      }
    }
  }
  
  // MARK: - React Native Bridge Methods
  
  @objc
  func initialize(_ resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
    Task { @MainActor in
      do {
        // Fetch products from App Store
        self.products = try await Product.products(for: self.productIDs)
        
        let productsData = self.products.map { product in
          return [
            "id": product.id,
            "displayName": product.displayName,
            "displayPrice": product.displayPrice,
            "price": NSNumber(value: product.price),
            "description": product.description
          ] as [String : Any]
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
                       rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
    Task { @MainActor in
      guard let product = self.products.first(where: { $0.id == productId }) else {
        reject("PRODUCT_NOT_FOUND", "Product not found: \(productId)", nil)
        return
      }
      
      do {
        let result = try await product.purchase()
        
        switch result {
        case .success(let verification):
          switch verification {
          case .verified(let transaction):
            await transaction.finish()
            
            let expirationTimestamp: NSNumber
            if let expirationDate = transaction.expirationDate {
              expirationTimestamp = NSNumber(value: expirationDate.timeIntervalSince1970)
            } else {
              expirationTimestamp = NSNumber(value: 0)
            }
            
            let purchaseData: [String: Any] = [
              "productId": transaction.productID,
              "transactionId": String(transaction.id),
              "purchaseDate": NSNumber(value: transaction.purchaseDate.timeIntervalSince1970),
              "expirationDate": expirationTimestamp
            ]
            
            resolve(purchaseData)
            
          case .unverified(let transaction, let error):
            await transaction.finish()
            reject("VERIFICATION_FAILED", "Transaction verification failed: \(error.localizedDescription)", nil)
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
                        rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
    Task { @MainActor in
      do {
        try await AppStore.sync()
        
        var restoredPurchases: [[String: Any]] = []
        
        for await result in Transaction.currentEntitlements {
          if case .verified(let transaction) = result {
            let expirationDate = transaction.expirationDate ?? Date()
            if expirationDate > Date() {
              let expirationTimestamp: NSNumber
              if let expDate = transaction.expirationDate {
                expirationTimestamp = NSNumber(value: expDate.timeIntervalSince1970)
              } else {
                expirationTimestamp = NSNumber(value: 0)
              }
              
              let purchaseData: [String: Any] = [
                "productId": transaction.productID,
                "transactionId": String(transaction.id),
                "purchaseDate": NSNumber(value: transaction.purchaseDate.timeIntervalSince1970),
                "expirationDate": expirationTimestamp
              ]
              
              restoredPurchases.append(purchaseData)
            }
          }
        }
        
        let resultData: [String: Any] = [
          "success": true,
          "purchases": restoredPurchases,
          "count": restoredPurchases.count
        ]
        resolve(resultData)
      } catch {
        reject("RESTORE_ERROR", "Failed to restore purchases: \(error.localizedDescription)", error)
      }
    }
  }
  
  @objc
  func checkActiveSubscription(_ resolve: @escaping RCTPromiseResolveBlock,
                                rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
    Task { @MainActor in
      var hasActiveSubscription = false
      var activeProductId: String? = nil
      
      for await result in Transaction.currentEntitlements {
        if case .verified(let transaction) = result {
          let expirationDate = transaction.expirationDate ?? Date()
          if expirationDate > Date() {
            hasActiveSubscription = true
            activeProductId = transaction.productID
            break
          }
        }
      }
      
      let resultData: [String: Any] = [
        "hasActive": hasActiveSubscription,
        "productId": activeProductId as Any
      ]
      resolve(resultData)
    }
  }
  
  // Required for RCTEventEmitter
  override func supportedEvents() -> [String]! {
    return []
  }
  
  override static func requiresMainQueueSetup() -> Bool {
    return false
  }
}

