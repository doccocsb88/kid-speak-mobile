#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import "../../node_modules/react-native/Libraries/AppDelegate/RCTReactNativeFactory.h"
#import "../../build/generated/ios/RCTAppDependencyProvider.h"

@interface AppDelegate ()
@property (nonatomic, strong) RCTReactNativeFactory *reactNativeFactory;
@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  
  // Set up dependency provider for New Architecture
  self.dependencyProvider = [[RCTAppDependencyProvider alloc] init];
  
  // Create React Native factory with New Architecture enabled
  self.reactNativeFactory = [[RCTReactNativeFactory alloc] initWithDelegate:self];
  
  // Start React Native with module name
  [self.reactNativeFactory startReactNativeWithModuleName:@"kidspeak-mobile"
                                                  inWindow:self.window
                                             launchOptions:launchOptions];

  // Match window background to avoid black flash
  self.window.backgroundColor = [UIColor colorWithRed:0.91 green:0.96 blue:1.0 alpha:1.0]; // #E8F4FF
  [self.window makeKeyAndVisible];
  return YES;
}

#pragma mark - RCTReactNativeFactoryDelegate

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
