const fsPromises = require("node:fs").promises

const UglifyJS = require("uglify-js")
const CleanCSS = require("clean-css")

const nameCache = {}
const defaultOptions = {
	compress: {
		passes: 3,
		unsafe: true,
		unsafe_Function: true,
		unsafe_math: true,
		unsafe_proto: true,
		unsafe_regexp: true
	}
}

const results = []
const minifyFile = async (inputPath, options = {}) => {
	const filename = inputPath.split("/").pop()
	const content = await fsPromises.readFile(inputPath, "utf8")

	let result = {}
	if (filename.endsWith(".js")) {
		result = UglifyJS.minify({
			[inputPath]: content
		}, {
			sourceMap: {
				root: "https://tk-embed.chaoshosting.eu/assets/",
				filename,
				url: filename + ".map"
			},
			warnings: "verbose",
			parse: {
				shebang: false
			},
			toplevel: true,
			nameCache,
			mangle: true,
			...defaultOptions,
			...options
		})

		if (result.error) throw result.error
		if (result.warnings && result.warnings.length > defaultOptions.compress.passes) console.log(inputPath, result.warnings)
	} else if (filename.endsWith(".css")) {
		const clean = new CleanCSS({
			compatibility: {
				colors: {
					hexAlpha: true
				},
				properties: {
					shorterLengthUnits: true,
					urlQuotes: false
				}
			},
			level: {
				2: {
					mergeSemantically: false, // true sorgt für eine fehlerhafte Reihenfolge, welche für die wandering-cubes jedoch wichtig ist
					removeUnusedAtRules: false // true sorgt für Fehler bei Variablen: "animation: notifAn var(--time, 10s) ease forwards;"
				}
			},
			inline: false,
			sourceMap: true,
			...options
		})

		const output = clean.minify(content)
		result = {
			code: output.styles + "\n/*# sourceMappingURL=" + filename + ".map */",
			map: output.sourceMap.toString().replace("$stdin", filename)
		}

		if (output.warnings.length > 0 || output.errors.length > 0) console.log(inputPath, output.warnings, output.errors)
	} else if (filename.endsWith(".json")) {
		result = {
			code: JSON.stringify(JSON.parse(content))
		}
	} else return console.error("Unknown minify file type: " + inputPath)

	if (result.code.length >= content.length) return console.log("No reduction for " + inputPath + " (" + content.length + " -> " + result.code.length + ")")

	if (process.env.MINIFY_ENABLED) {
		await fsPromises.writeFile(inputPath, result.code)
		if (result.map) await fsPromises.writeFile(inputPath + ".map", result.map)
	}

	results.push({
		path: inputPath.slice(2),
		size: content.length,
		compressed: result.code.length,
		"% reduction": Number.parseFloat((100 - (result.code.length / content.length * 100)).toFixed(1))
	})
}

const main = async () => {
	await minifyFile("./assets/script.js")
	await minifyFile("./assets/emojis.js", {
		compress: {
			...defaultOptions.compress,
			top_retain: ["emojis"]
		},
		mangle: {
			reserved: ["emojis"]
		}
	})
	await minifyFile("./assets/twemoji.js", {
		compress: {
			...defaultOptions.compress,
			top_retain: ["twemoji"]
		},
		mangle: {
			reserved: ["twemoji"]
		}
	})
	await minifyFile("./assets/sockette.js", {
		compress: {
			...defaultOptions.compress,
			top_retain: ["sockette"]
		},
		mangle: {
			reserved: ["sockette"]
		}
	})

	await minifyFile("./assets/style.css")
	await minifyFile("./assets/CodeMirror-material-darker.css")
	await minifyFile("./assets/manifest.json")

	results.push({
		path: "= Total",
		size: results.reduce((acc, cur) => acc + cur.size, 0),
		compressed: results.reduce((acc, cur) => acc + cur.compressed, 0),
		"% reduction": Number.parseFloat((100 - (results.reduce((acc, cur) => acc + cur.compressed, 0) / results.reduce((acc, cur) => acc + cur.size, 0) * 100)).toFixed(1))
	})
	console.table(results.sort((a, b) => a["% reduction"] - b["% reduction"]))
}
main()
