## [1.3.0](https://github.com/wheblabs/whop-client/compare/v1.2.0...v1.3.0) (2025-12-03)

### Features

* add request timeouts, retry utilities, and auth helpers ([7d03c7e](https://github.com/wheblabs/whop-client/commit/7d03c7e93f3f2bf91308a905d32fdc3b8d5435dc))

## [1.2.0](https://github.com/wheblabs/whop-client/compare/v1.1.0...v1.2.0) (2025-12-02)

### Features

* add request/response interceptors for lifecycle hooks ([a679e7b](https://github.com/wheblabs/whop-client/commit/a679e7bd1e0d0f5453e4e68b2e187a787386241d))

## [1.1.0](https://github.com/wheblabs/whop-client/compare/v1.0.0...v1.1.0) (2025-12-02)

### Features

* add comprehensive SDK resources for first-class developer experience ([522ddda](https://github.com/wheblabs/whop-client/commit/522ddda840ba9428e323d9e93124ae0c7ac3584f))

## 1.0.0 (2025-12-02)

### Features

* add access pass and plan management ([1347fbd](https://github.com/wheblabs/whop-client/commit/1347fbd122e32d22faf4f666eb74dffe931ae22c))
* add apps.update(), me.get(), companies.listExperiences(), and apps.getUrl() ([72427a5](https://github.com/wheblabs/whop-client/commit/72427a5a1b3ed6dfb9bd40b06af8c1046611137d))
* add appStore resource for querying public apps ([b65fa16](https://github.com/wheblabs/whop-client/commit/b65fa167f0eb55a04173158f13f59baa2f9c8fee))
* add baseUrl option to apps.create() ([704a806](https://github.com/wheblabs/whop-client/commit/704a80602ff92a71ed44dd76e33838188457663c))
* add comprehensive API resources and CI/CD pipeline ([e787b17](https://github.com/wheblabs/whop-client/commit/e787b179fe5723412cc95f61ef4c1cf202e770ed))
* add listAccessPassPlans method and plan type improvements ([cb8da29](https://github.com/wheblabs/whop-client/commit/cb8da29f8bf29cc92c9f270455773bace33bc09a))
* add memberships collection to company builder ([469c643](https://github.com/wheblabs/whop-client/commit/469c6439f8b5fb8acdbbfdb837aa17bd3040bf18))
* add onTokenRefresh callback for database-backed token storage ([72867eb](https://github.com/wheblabs/whop-client/commit/72867ebe3b7c2e8f241a5aa039d1b05ed51705d2))
* enhance createAccessPass to return plan details ([a07be7f](https://github.com/wheblabs/whop-client/commit/a07be7f98092c5145052eb672ea3931d449eeca5))
* enhance listAccessPasses with type filtering and plan details ([30340c9](https://github.com/wheblabs/whop-client/commit/30340c95fe080ede0ca377256ca6a856b5b42d9f))
* implement builder pattern API for hierarchical resource access ([446d684](https://github.com/wheblabs/whop-client/commit/446d684de75bf178a9db03796ac25274431c6018))
* update GraphQL queries for new Whop schema ([551294a](https://github.com/wheblabs/whop-client/commit/551294aa594e0428269d63db8f460de8fbf34dde))

### Bug Fixes

* auto-fetch plan details when creating access pass with planOptions ([b0ba271](https://github.com/wheblabs/whop-client/commit/b0ba271467f840845c94102059d55b12214b09cb))
* remove obsolete build:fix-duplicate script ([d11efe4](https://github.com/wheblabs/whop-client/commit/d11efe4be07904dce727d92892864bb36941a427))
* update createAccessPass mutation for new API schema ([c1feef4](https://github.com/wheblabs/whop-client/commit/c1feef4f0cbb34f8d13521fc9357d7cda4fb2669))
* update GraphQL mutations to match current Whop API schema ([70ad218](https://github.com/wheblabs/whop-client/commit/70ad2182a7245eea7432cfcfd7cc52aefc4be97f))
