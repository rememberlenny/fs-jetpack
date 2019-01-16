import * as fse from "fs-extra";
import { expect } from "chai";
import path from "./assert_path";
import helper from "./helper";
import * as jetpack from "..";

describe("rename", () => {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("renames file", () => {
    const preparations = () => {
      fse.outputFileSync("a/b.txt", "abc");
    };

    const expectations = () => {
      path("a/b.txt").shouldNotExist();
      path("a/x.txt").shouldBeFileWithContent("abc");
    };

    it("sync", () => {
      preparations();
      jetpack.rename("a/b.txt", "x.txt");
      expectations();
    });

    it("async", done => {
      preparations();
      jetpack.renameAsync("a/b.txt", "x.txt").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("renames directory", () => {
    const preparations = () => {
      fse.outputFileSync("a/b/c.txt", "abc");
    };

    const expectations = () => {
      path("a/b").shouldNotExist();
      path("a/x").shouldBeDirectory();
    };

    it("sync", () => {
      preparations();
      jetpack.rename("a/b", "x");
      expectations();
    });

    it("async", done => {
      preparations();
      jetpack.renameAsync("a/b", "x").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("respects internal CWD of jetpack instance", () => {
    const preparations = () => {
      fse.outputFileSync("a/b/c.txt", "abc");
    };

    const expectations = () => {
      path("a/b").shouldNotExist();
      path("a/x").shouldBeDirectory();
    };

    it("sync", () => {
      const jetContext = jetpack.cwd("a");
      preparations();
      jetContext.rename("b", "x");
      expectations();
    });

    it("async", done => {
      const jetContext = jetpack.cwd("a");
      preparations();
      jetContext.renameAsync("b", "x").then(() => {
        expectations();
        done();
      });
    });
  });

  describe("input validation", () => {
    const tests = [
      { type: "sync", method: jetpack.rename as any, methodName: "rename" },
      {
        type: "async",
        method: jetpack.renameAsync as any,
        methodName: "renameAsync"
      }
    ];

    describe('"path" argument', () => {
      tests.forEach(test => {
        it(test.type, () => {
          expect(() => {
            test.method(undefined, "xyz");
          }).to.throw(
            `Argument "path" passed to ${
              test.methodName
            }(path, newName) must be a string. Received undefined`
          );
        });
      });
    });

    describe('"newName" argument', () => {
      describe('type check', () => {
        tests.forEach(test => {
          it(test.type, () => {
            expect(() => {
              test.method("abc", undefined);
            }).to.throw(
              `Argument "newName" passed to ${
                test.methodName
              }(path, newName) must be a string. Received undefined`
            );
          });
        });
      });
      describe('slashes not allowed', () => {
        tests.forEach(test => {
          it(test.type, () => {
            expect(() => {
              test.method("abc", "new-name/with-a-slash");
            }).to.throw(
              `Argument "newName" passed to ${
                test.methodName
              }(path, newName) cannot have a slash; got "new-name/with-a-slash"`
            );
          });
        });
      });
    });
  });
});
