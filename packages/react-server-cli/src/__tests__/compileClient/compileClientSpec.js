import fs from "fs";
const MemoryStream = require('memory-stream');
import path from "path";
import mockery from "mockery";

describe("compileClient", () => {
	let mockFs,
		writeWebpackCompatibleRoutesFile;

	beforeAll(() => {
		mockery.registerSubstitute('./callerDependency', './callerDependency-Mock');
		mockery.enable({
			useCleanCache: true,
			warnOnUnregistered: false,
		});

		writeWebpackCompatibleRoutesFile = require("../../compileClient").writeWebpackCompatibleRoutesFile;
	});

	afterAll(() => {
		mockery.disable();
	});

	describe("writes client routes file for Webpack", () => {
		const pathStringTests = [
			{
				title: "apostrophes",
				path: "PathWith'InIt.js",
			},
			{
				title: "double quotes",
				path: 'PathWith"InIt.js',
			},
			{
				title: "windows style",
				path: 'c:\\Path\\With\\InIt.js',
			},
			{
				title: "spaces",
				path: 'Path With Spaces.js',
			},
		];

		beforeEach(() => {
			mockFs = new MemoryStream();
		});

		afterEach(() => {
			mockFs = null;
		});

		pathStringTests.map((test) => {
			it("handles file paths with " + test.title, (finishTest) => {
				spyOn(fs, 'writeFileSync').and.callFake((path, data) => {
					mockFs.write(data);
				});

				const filePath = test.path;
				const routes = {
					"routes": {
						"Homepage": {
							"path": "/",
							"page": filePath,
						},
					},
				};

				writeWebpackCompatibleRoutesFile(routes, ".", path.normalize("."), null, true, null);

				const coreMiddlewareStringified = JSON.stringify(require.resolve("react-server-core-middleware"));
				const filePathStringified = JSON.stringify(filePath);

				// These four strings are important when using multiple platforms or strings with weird characters in them.
				// If we're going to output something to a file and then import that file later, we'd better be darn sure
				// it's all correctly formatted!  Apostrophes, quotes, and windows-style file path characters \ vs / are the worst!
				const filePathRegexStrings = [
					"var coreJsMiddleware = require(" + coreMiddlewareStringified + ").coreJsMiddleware;",
					"var coreCssMiddleware = require(" + coreMiddlewareStringified + ").coreCssMiddleware;",
					"cb(unwrapEs6Module(require(" + filePathStringified + ")));",
				];

				const fileData = mockFs.toString();
				filePathRegexStrings.map((regex) => {
					expect(fileData).toMatch(regex.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")); //eslint-disable-line no-useless-escape
				});

				finishTest();
			});
		});
	});
});
