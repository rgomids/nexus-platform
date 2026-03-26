const sharedConfig = {
  moduleFileExtensions: ["js", "json", "ts"],
  roots: ["<rootDir>/src", "<rootDir>/test"],
  setupFiles: ["<rootDir>/test/setup/test-environment.ts"],
  testEnvironment: "node",
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
      },
    ],
  },
};

module.exports = {
  projects: [
    {
      ...sharedConfig,
      displayName: "unit",
      testMatch: ["<rootDir>/test/unit/**/*.spec.ts"],
    },
    {
      ...sharedConfig,
      displayName: "integration",
      testMatch: ["<rootDir>/test/integration/**/*.spec.ts"],
      testTimeout: 120000,
    },
    {
      ...sharedConfig,
      displayName: "functional",
      testMatch: [
        "<rootDir>/test/functional/**/*.spec.ts",
        "<rootDir>/test/functional/**/*.e2e-spec.ts",
      ],
      testTimeout: 120000,
    },
  ],
};
