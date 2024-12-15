/**
 * Discord Embed Builder
 * Contribute or report issues at
 * https://github.com/Glitchii/embedbuilder
 * https://github.com/DEVTomatoCake/embedbuilder
 */

let jsonObject = {
	content: "A feature-rich message editor for TomatenKuchen & Manage Bot, made by TomatoCake.\n\n-# It supports all Discord Markdown features!",
	embeds: [
		{
			title: "Next steps",
			url: "https://docs.tomatenkuchen.com/messageeditor",
			description: "1. [Invite TomatenKuchen](https://tomatenkuchen.com/invite)\n2. Use the bot to import a message\n3. Send it using TomatenKuchen or a webhook!"
		}
	],
	components: [
		{
			type: 1,
			components: [
				{
					type: 2,
					label: "Primary Button",
					style: 1,
					custom_id: "button1"
				},{
					type: 2,
					label: "Secondary Button",
					style: 2,
					custom_id: "button2"
				},{
					type: 2,
					label: "Success Button",
					style: 3,
					custom_id: "button3"
				},{
					type: 2,
					label: "Danger Button",
					style: 4,
					custom_id: "button4"
				},{
					type: 2,
					label: "URL Button",
					style: 5,
					url: "https://tomatenkuchen.com"
				}
			]
		},{
			type: 1,
			components: [
				{
					type: 3,
					placeholder: "Select a value!",
					custom_id: "selectmenu",
					min_values: 1,
					max_values: 2,
					options: [
						{
							label: "Option 1",
							value: "option1"
						},{
							label: "Option 2",
							value: "option2"
						},{
							label: "Option 3",
							value: "option3"
						}
					]
				}
			]
		}
	]
}

const params = new URLSearchParams(location.search)
if (params.has("mb") || params.has("dgh")) jsonObject.embeds = []

const guiTabs = params.get("guitabs") || ["description"]
let reverseColumns = params.get("reverse") !== null
let autoUpdateUrl = localStorage.getItem("autoUpdateUrl")
let lastActiveGuiEmbedIndex = -1
let lastGuiJson

const guiEmbedIndex = guiEl => {
	const guiEmbed = guiEl?.closest(".guiEmbed")
	const gui = guiEmbed?.closest(".gui")

	return gui ? Array.from(gui.querySelectorAll(".guiEmbed")).indexOf(guiEmbed) : -1
}
const guiActionRowIndex = guiRo => {
	const guiActionRow = guiRo?.closest(".guiActionRow")
	const gui = guiActionRow?.closest(".gui")

	return gui ? Array.from(gui.querySelectorAll(".guiActionRow")).indexOf(guiActionRow) : -1
}
const guiComponentIndex = guiRo => {
	const guiComponent = guiRo?.closest(".guiComponent")
	const gui = guiComponent?.closest(".guiActionRow")

	return gui ? Array.from(gui.querySelectorAll(".guiComponent")).indexOf(guiComponent) : -1
}

const createElement = object => {
	let element
	for (const tag in object) {
		element = document.createElement(tag)

		for (const attr in object[tag])
			if (attr == "children") for (const child of object[tag][attr])
				element.appendChild(createElement(child))
			else element[attr] = object[tag][attr]
	}

	return element
}

const encodeJson = (withUrl = false) => {
	let data = btoa(encodeURIComponent(JSON.stringify({
		...jsonObject,
		embeds: jsonObject.embeds && jsonObject.embeds.length > 0 ? jsonObject.embeds : void 0,
		components: jsonObject.components && jsonObject.components.length > 0 ? jsonObject.components : void 0
	})))

	if (withUrl) {
		const url = new URL(location.href)
		url.searchParams.set("data", data)

		data = url.href
			// Replace %3D ('=' url encoded) with '='
			.replace(/data=\w+(?:%3D)+/g, "data=" + data)
	}

	return data
}

if (params.has("data")) jsonObject = JSON.parse(decodeURIComponent(atob(params.get("data").replace(/ /g, "+"))))
if (!jsonObject.embeds?.length) jsonObject.embeds = []

const reverse = reversed => {
	const side = document.querySelector(reversed ? ".side2" : ".side1")
	if (side.nextElementSibling) side.parentElement.insertBefore(side.nextElementSibling, side)
	else side.parentElement.insertBefore(side, side.parentElement.firstElementChild)
}

const urlOptions = (target, value) => {
	const url = new URL(location.href)
	url.searchParams.set(target, value)

	try {
		history.replaceState(null, null, url.href.replace(/(?<!data=[^=]+|=)=(&|$)/g, x => x == "=" ? "" : "&"))
	} catch (e) {
		// 'SecurityError' when trying to change the url of a different origin
		// e.g. when trying to change the url of the parent window from an iframe
		console.info(e)
	}
}

const buttonStyles = {
	1: "primary",
	2: "secondary",
	3: "success",
	4: "danger",
	5: "url"
}

const animateGuiEmbedNameAt = (i, text) => {
	const guiEmbedName = document.querySelectorAll(".gui .guiEmbedName")?.[i]
	// Shake animation
	guiEmbedName?.animate([
		{ transform: "translate(0, 0)" },
		{ transform: "translate(10px, 0)" },
		{ transform: "translate(0, 0)" }
	], { duration: 100, iterations: 3 })

	if (text) guiEmbedName?.style.setProperty("--text", "\"" + text + "\"")

	guiEmbedName?.scrollIntoView({ behavior: "smooth", block: "center" })
	guiEmbedName?.classList.remove("empty")
	setTimeout(() => guiEmbedName?.classList.add("empty"), 10)
}

const indexOfEmptyGuiEmbed = text => {
	for (const [i, element] of document.querySelectorAll(".msgEmbed > .container .embed").entries())
		if (element.classList.contains("emptyEmbed")) {
			if (text !== false) animateGuiEmbedNameAt(i, text)
			return i
		}

	for (const [i, embedObj] of (jsonObject.embeds || []).entries())
		if (!(0 in Object.keys(embedObj))) {
			if (text !== false) animateGuiEmbedNameAt(i, text)
			return i
		}

	return -1
}

const changeLastActiveGuiEmbed = index => {
	if (index == -1) {
		lastActiveGuiEmbedIndex = -1
		return ""
	}

	lastActiveGuiEmbedIndex = index
}

const afterBuilding = () => {
	if (autoUpdateUrl) urlOptions("data", encodeJson())
}

// Parses emojis to images and adds code highlighting.
const externalParsing = ({ noEmojis, element } = {}) => {
	if (!noEmojis) twemoji.parseNode(element || document.querySelector(".msgEmbed"))
	for (const block of document.querySelectorAll(".markup pre > code")) hljs.highlightElement(block)

	const embed = element?.closest(".embed")
	if (embed?.textContent.trim()) embed.classList.remove("emptyEmbed")

	afterBuilding()
}

const url = str => /^(https?:|attachment:)?\/\//.test(str) ? str : "https://" + str
const imgProxy = str => str.length > 3 && str.includes(".") && !str.startsWith("attachment:") ?
	("https://tk-api.chaoshosting.eu/image-proxy?url=" + encodeURIComponent(url(str)) + "&origin=" + encodeURIComponent(location.origin)) : ""
const imgSrc = (elem, src) => elem.style.content = "url(" + imgProxy(src) + ")"
const hide = el => el.style.removeProperty("display")
const encode = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")

const timestamp = stringISO => {
	const date = stringISO ? new Date(stringISO) : new Date()
	const dateArray = date.toLocaleString(void 0, { hour: "numeric", minute: "numeric" })
	const today = new Date()
	const yesterday = new Date(new Date().setDate(today.getDate() - 1))
	const tomorrow = new Date(new Date().setDate(today.getDate() + 1))

	if (today.toDateString() == date.toDateString()) return "Today at " + dateArray
	if (yesterday.toDateString() == date.toDateString()) return "Yesterday at " + dateArray
	if (tomorrow.toDateString() == date.toDateString()) return "Tomorrow at " + dateArray
	return new Date().toLocaleDateString() + " " + dateArray
}

const markup = (txt = "", { replaceEmojis = false, replaceHeaders = false, inlineBlock = false } = {}) => {
	if (replaceEmojis) txt = txt.replace(/(?<!code(?: \w+=".+")?>[^>]+)(?<!\/[^\s"]+?):((?!\/)[-+\w]+):/g, (match, p) => p && emojis[p] ? emojis[p] : match)

	txt = txt
		.trim()
		.replace(/&lt;:\w+:(\d{17,21})&gt;/g, "<img class='emoji' src='https://cdn.discordapp.com/emojis/$1.webp' crossorigin='anonymous'>")
		.replace(/&lt;a:\w+:(\d{17,21})&gt;/g, "<img class='emoji' src='https://cdn.discordapp.com/emojis/$1.gif' crossorigin='anonymous'>")
		.replace(/~~(.+?)~~/g, "<s>$1</s>")
		.replace(/\*\*\*(.+?)\*\*\*/g, "<em><strong>$1</strong></em>")
		.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
		.replace(/__(.+?)__/g, "<u>$1</u>")
		.replace(/\*(.+?)\*/g, "<em>$1</em>")
		.replace(/_(.+?)_/g, "<em>$1</em>")
		.replace(/\|\|(.+?)\|\|/g, "<span class='spoiler'>$1</span>")
		// Replace non-markdown links
		.replace(/(^| )(https?:\/\/\S+)/gim, "$1<a href='$2' target='_blank' rel='noopener' class='anchor'>$2</a>")

	if (replaceHeaders) txt = txt
		.replace(/^###[\t          ]+([\S\t ]+)/gm, "<span class='h3'>$1</span>")
		.replace(/^##[\t          ]+([\S\t ]+)/gm, "<span class='h2'>$1</span>")
		.replace(/^#[\t          ]+([\S\t ]+)/gm, "<span class='h1'>$1</span>")
		.replace(/^-#[\t          ]+([\S\t ]+)/gm, "<small class='subtext'>$1</small>")

	let listType
	txt = txt
		.replace(/^(-|\*|\d\.)[\t ]([\S \t]+)/gm, (match, p1, p2) => {
			let prefix = ""
			if (!listType) {
				if (p1 == "-" || p1 == "*") listType = "ul"
				else listType = "ol"
				prefix += "<" + listType + ">"
			}

			let suffix = ""
			const splitted = txt.split("\n")
			if (
				(listType == "ul" && splitted[splitted.indexOf(match) + 1] && !splitted[splitted.indexOf(match) + 1].startsWith("-") && !splitted[splitted.indexOf(match) + 1].startsWith("*")) ||
				(listType == "ol" && splitted[splitted.indexOf(match) + 1] && !/^\d+\./.test(splitted[splitted.indexOf(match) + 1].split(" ")[0])) ||
				!splitted[splitted.indexOf(match) + 1]
			) {
				suffix += "</" + listType + ">"
				listType = void 0
			}

			return prefix + "<li>" + p2 + "</li>" + suffix
		})
		// Replace >>> and > with block-quotes. &gt; is HTML code for >
		.replace(/^(?: *&gt;&gt;&gt; ([\s\S]*))|(?:^ *&gt;(?!&gt;&gt;) +.+\n)+(?:^ *&gt;(?!&gt;&gt;) .+\n?)+|^(?: *&gt;(?!&gt;&gt;) ([^\n]*))(\n?)/gm, (all, match1, match2, newLine) =>
			"<div class='blockquote'><div class='blockquoteDivider'></div><blockquote>" + (match1 || match2 || newLine ? (match1 || match2) : all.replace(/^ *&gt; /gm, "")) + "</blockquote></div>"
		)

		// Mentions
		.replace(/&lt;id:customize&gt;/g, "<span class='mention channel'>Channels & Roles</span>")
		.replace(/&lt;id:home&gt;/g, "<span class='mention channel'>Server Guide</span>")
		.replace(/&lt;id:browse&gt;/g, "<span class='mention channel'>Browse Channels</span>")
		.replace(/&lt;#(\d{17,21})&gt;/g, "<span class='mention channel interactive'>channel: $1</span>")
		.replace(/&lt;@&amp;(\d{17,21})&gt;/g, "<span class='mention interactive'>@role: $1</span>")
		.replace(/&lt;@(\d{17,21})&gt;|@(?:everyone|here)/g, (all, match1) => {
			if (all.startsWith("@")) return "<span class='mention'>" + all + "</span>"
			return "<span class='mention interactive'>@user: " + match1 + "</span>"
		})
		.replace(/\[([^[\]]+)\]\((https?:\/\/\S+)( &#039;([^\n]+?)&#039;)?\)/g, (all, match1, match2, match3, match4) =>
			"<a href='" + match2 + "' target='_blank' rel='noopener' class='anchor'" + (match4 ? " title='" + match4 + "'" : "") + ">" + match1 + "</a>"
		)

		// Timestamps
		.replace(/&lt;t:([0-9]{1,14})(:([tTdDfFR]))?&gt;/g, (all, match1, match2, match3) => {
			const dateInput = new Date(Number.parseInt(match1) * 1000)
			let time = ""
			if (match3 == "d") time = dateInput.toLocaleString(void 0, {day: "2-digit", month: "2-digit", year: "numeric"})
			else if (match3 == "D") time = dateInput.toLocaleString(void 0, {day: "numeric", month: "long", year: "numeric"})
			else if (!match3 || match3 == "f") time = dateInput.toLocaleString(void 0, {day: "numeric", month: "long", year: "numeric"}) + " " +
				dateInput.toLocaleString(void 0, {hour: "2-digit", minute: "2-digit"})
			else if (match3 == "F") time = dateInput.toLocaleString(void 0, {day: "numeric", month: "long", year: "numeric", weekday: "long"}) + " " +
				dateInput.toLocaleString(void 0, {hour: "2-digit", minute: "2-digit"})
			else if (match3 == "t") time = dateInput.toLocaleString(void 0, {hour: "2-digit", minute: "2-digit"})
			else if (match3 == "T") time = dateInput.toLocaleString(void 0, {hour: "2-digit", minute: "2-digit", second: "2-digit"})
			else if (match3 == "R") time = Math.round((Date.now() - (Number.parseInt(match1) * 1000)) / 1000 / 60) + " minutes ago"

			return "<span class='spoiler'>" + time + "</span>"
		})

	if (inlineBlock)
		// Treat both inline code and code blocks as inline code
		txt = txt.replace(/`([^`]+?)`|``([^`]+?)``|```((?:\n|.)+?)```/g, (m, x, y, z) => {
			if (x || y || z) return "<code class='inline'>" + (x || y || z) + "</code>"
			return m
		})
	else txt = txt
		// Code block
		.replace(/```(?:([a-z0-9_+\-.]+?)\n)?\n*([^\n][^]*?)\n*```/ig, (m, lang, code) => {
			if (lang) return "<pre><code class='language-" + lang + "'>" + code.trim() + "</code></pre>"
			else return "<pre><code class='nohighlight'>" + code.trim() + "</code></pre>"
		})
		// Inline code
		.replace(/`([^`]+?)`|``([^`]+?)``/g, (m, x, y) => {
			if (x || y) return "<code class='inline'>" + (x || y) + "</code>"
			return m
		})

	return txt
}

const display = (el, data, displayType) => {
	if (data) el.innerHTML = data
	el.style.display = displayType || "unset"
}

const uploadError = (message, browse, sleepTime = 7000) => {
	browse.classList.remove("loading")
	browse.classList.add("error")

	const p = browse.parentElement.querySelector(".browse.error > p")
	p.dataset.error = encode(message)

	setTimeout(() => {
		browse.classList.remove("error")
		delete p.dataset.error
	}, sleepTime)
}

//let serverData = {}
document.addEventListener("DOMContentLoaded", () => {
	if (reverseColumns || localStorage.getItem("reverseColumns")) reverse()

	if (top != self) {
		document.getElementById("auto").parentElement.remove()
		document.getElementById("send-webhook").remove()
		document.getElementById("import-button").remove()
		document.getElementById("sendbot-button").remove()

		window.onmessage = e => {
			if ((e.origin == "https://tomatenkuchen.com" || e.origin == "https://beta.tomatenkuchen.com" || e.origin == "http://localhost:4269")) {
				console.log("Received message from parent window:", encode(e.data.replace(/\n|\r/g, "")))
				if (e.data == "requestMessage") window.top.postMessage("respondMessage_" + encodeJson(), "*")
				//else if (e.data.startsWith("serverData_")) serverData = JSON.parse(e.data.replace("serverData_", ""))
			}
		}
	} else if (autoUpdateUrl) {
		document.body.classList.add("autoUpdateUrl")
		document.querySelector(".item.auto > input").checked = true
	}

	if (params.get("editor") == "json") {
		document.body.classList.remove("gui")
		document.getElementById("addContainer").classList.add("hidden-imp")
	}

	document.getElementsByClassName("username")[0].textContent = params.has("dgh") ? "DisGitHook" : (params.has("mb") ? "Manage Bot" : "TomatenKuchen")
	document.getElementsByClassName("avatar")[0].src = "./assets/images/" + (params.has("dgh") ? "gitdishook.png" : (params.has("mb") ? "managebot_40" : "background_40") + ".webp")
	document.getElementsByClassName("avatar")[0].srcset =
		"./assets/images/" + (params.has("dgh") ? "gitdishook.png" : (params.has("mb") ? "managebot_40" : "background_40") + ".webp") + " 1x, " +
		"./assets/images/" + (params.has("dgh") ? "gitdishook.png" : (params.has("mb") ? "managebot_40" : "background_60") + ".webp") + " 2x"

	if ((params.has("light") && localStorage.getItem("theme") != "dark") || localStorage.getItem("theme") == "light") document.body.classList.add("light")

	for (const e of document.querySelectorAll(".clickable > img"))
		e.parentElement.addEventListener("mouseup", el => window.open(el.target.src))

	const editorHolder = document.getElementById("editorHolder"),
		messageContent = document.getElementById("messageContent"),
		actionRowCont = document.getElementById("components"),
		embedCont = document.querySelector(".msgEmbed > .container"),
		gui = document.querySelector(".top .gui:first-of-type")

	const editor = CodeMirror(elt => editorHolder.parentNode.replaceChild(elt, editorHolder), {
		value: JSON.stringify(jsonObject, null, "\t"),
		gutters: ["CodeMirror-foldgutter", "CodeMirror-lint-markers"],
		scrollbarStyle: "overlay",
		mode: "application/json",
		theme: "material-darker",
		matchBrackets: true,
		foldGutter: true,
		lint: true,
		extraKeys: {
			// Fill in indent on a new line when enter (return) key is pressed.
			Enter: () => {
				const cursor = editor.getCursor()
				const end = editor.getLine(cursor.line)
				const nextLine = editor.getLine(cursor.line + 1)

				if ((nextLine === void 0 || !nextLine.trim()) && !end.substr(cursor.ch).trim())
					editor.replaceRange("\n", { line: cursor.line, ch: cursor.ch })
				else editor.replaceRange("\n" + (end.replace(/\S($|.)+/g, "") || "\t\n") + (end.endsWith("{") ? "\t" : ""), {
						line: cursor.line,
						ch: cursor.ch
					})
			}
		}
	})
	editor.focus()

	const notif = document.getElementById("notification")
	const error = (msg, time = "5s") => {
		notif.textContent = msg
		notif.style.removeProperty("--startY")
		notif.style.removeProperty("--startOpacity")
		notif.style.setProperty("--time", time)
		notif.onanimationend = () => notif.style.display = null

		// If notification element is not already visible, (no other message is already displayed), display it.
		if (!notif.style.display) return notif.style.display = "block"

		// If there's a message already displayed, update it and delay animating out.
		notif.style.setProperty("--startY", 0)
		notif.style.setProperty("--startOpacity", 1)
		notif.style.display = null
		setTimeout(() => notif.style.display = "block", 1)

		return false
	}

	const createEmbedFields = (fields, embedFields) => {
		embedFields.innerHTML = ""
		let index, gridCol

		let colNum = 1
		for (const [i, f] of fields.entries()) {
			if (f.name && f.value) {
				const fieldElement = embedFields.insertBefore(document.createElement("div"), null)
				// if both the field of index 'i' and the next field on it's right are inline and -
				if (fields[i].inline && fields[i + 1]?.inline &&
					// it's the first field in the embed or -
					((i == 0 && fields[i + 2] && !fields[i + 2].inline) || ((
						// it's not the first field in the embed but the previous field is not inline or -
						i > 0 && !fields[i - 1].inline ||
						// it has 3 or more fields behind it and 3 of those are inline except the 4th one back if it exists -
						i >= 3 && fields[i - 1].inline && fields[i - 2].inline && fields[i - 3].inline && (fields[i - 4] ? !fields[i - 4].inline : !fields[i - 4])
						// or it's the first field on the last row or the last field on the last row is not inline or it's the first field in a row and it's the last field on the last row.
					) && (i == fields.length - 2 || !fields[i + 2].inline))) || i % 3 == 0 && i == fields.length - 2) {
					// then make the field halfway (and the next field will take the other half of the embed).
					index = i
					gridCol = "1 / 7"
				}
				// The next field.
				if (index == i - 1) gridCol = "7 / 13"

				if (f.inline) {
					if (i && !fields[i - 1].inline) colNum = 1

					fieldElement.outerHTML =
						"<div class='embedField " + (gridCol ? " colNum-2" : "") + "' style='grid-column: " + (gridCol || (colNum + " / " + (colNum + 4))) + ";'>" +
						"<div class='embedFieldName'>" + markup(encode(f.name), { replaceEmojis: true, inlineBlock: true }) + "</div>" +
						"<div class='embedFieldValue'>" + markup(encode(f.value), { replaceEmojis: true }) + "</div>" +
						"</div>"

					if (index != i) gridCol = false
				} else fieldElement.outerHTML = "<div class='embedField' style='grid-column: 1 / 13;'>" +
					"<div class='embedFieldName'>" + markup(encode(f.name), { replaceEmojis: true, inlineBlock: true }) + "</div>" +
					"<div class='embedFieldValue'>" + markup(encode(f.value), { replaceEmojis: true }) + "</div>" +
					"</div>"

				colNum = (colNum == 9 ? 1 : colNum + 4)
			}
		}

		for (const e of document.querySelectorAll(".embedField[style='grid-column: 1 / 5;']"))
			if (!e.nextElementSibling || e.nextElementSibling.style.gridColumn == "1 / 13") e.style.gridColumn = "1 / 13"

		display(embedFields, void 0, "grid")
	}

	const [guiFragment, fieldFragment, componentFragment, embedFragment, actionRowFragment] = Array.from({ length: 5 }, () => document.createDocumentFragment())
	fieldFragment.appendChild(document.querySelector(".edit > .fields > .field").cloneNode(true))
	componentFragment.appendChild(document.querySelector(".guiActionRow > .guiComponent").cloneNode(true))
	embedFragment.appendChild(document.querySelector(".embed.markup").cloneNode(true))
	actionRowFragment.appendChild(document.querySelector(".actionrow.markup").cloneNode(true))

	document.querySelector(".embed.markup").remove()
	gui.querySelector(".edit > .fields > .field").remove()

	for (const child of gui.childNodes) guiFragment.appendChild(child.cloneNode(true))

	// Renders embed and message content.
	const buildEmbed = ({ jsonData, only, index = 0, componentIndex = 0 } = {}) => {
		if (jsonData) jsonObject = jsonData
		if (!jsonObject.embeds?.length) document.body.classList.add("emptyEmbed")

		try {
			if (jsonObject.content) {
				messageContent.innerHTML = markup(encode(jsonObject.content), { replaceEmojis: true, replaceHeaders: true })
				document.body.classList.remove("emptyContent")
			} else document.body.classList.add("emptyContent")

			const embed = document.querySelectorAll(".container > .embed")[index]
			const embedObj = jsonObject.embeds?.[index] || {}
			if (only && only.startsWith("embed") && (!embed || !embedObj)) return buildEmbed()

			const componentElem = document.querySelectorAll(".actionrow")?.[index]?.children[componentIndex]
			const componentObj = jsonObject.components?.[index]?.components?.[componentIndex] || {}
			if (only && only.startsWith("component") && (!componentElem || !componentObj)) return buildEmbed()

			switch (only) {
				// If only updating the message content and nothing else, return here.
				case "content": return externalParsing({ element: messageContent })
				case "embedTitle":
					const embedTitle = embed?.querySelector(".embedTitle")
					if (!embedTitle) return buildEmbed()

					if (embedObj.title) display(embedTitle, markup(embedObj.url
						? "<a class='anchor' href='" + encode(url(embedObj.url)) + "' target='_blank' rel='noopener'>" + encode(embedObj.title) + "</a>"
						: encode(embedObj.title), { replaceEmojis: true, inlineBlock: true }))
					else hide(embedTitle)

					return externalParsing({ element: embedTitle })
				case "embedUrl":
					const embedUrl = embed?.querySelector(".embedUrl")
					if (!embedUrl) return buildEmbed()

					if (embedObj.title) display(embedUrl, markup(embedObj.url
						? "<a class='anchor' href='" + encode(url(embedObj.url)) + "' target='_blank' rel='noopener'>" + encode(embedObj.title) + "</a>"
						: encode(embedObj.title), { replaceEmojis: true, inlineBlock: true }))
					else hide(embedUrl)

					return externalParsing({ element: embedUrl })
				case "embedAuthorName":
				case "embedAuthorIcon":
				case "embedAuthorUrl":
					const embedAuthor = embed?.querySelector(".embedAuthor")
					if (!embedAuthor) return buildEmbed()

					if (embedObj.author?.name) display(embedAuthor,
						(embedObj.author.icon_url ? "<img class='embedAuthorIcon embedAuthorIcon' src='" + imgProxy(embedObj.author.icon_url) + "'>" : "") +
						(embedObj.author.url ? "<a class='embedAuthorUrl embedLink embedAuthorName' href='" + encode(url(embedObj.author.url)) + "' target='_blank' rel='noopener'>" +
							encode(embedObj.author.name) + "</a>" : "<span class='embedAuthorName'>" + encode(embedObj.author.name) + "</span>"), "flex")
					else hide(embedAuthor)

					return externalParsing({ element: embedAuthor })
				case "embedColor":
					const embedGrid = embed?.closest(".embed")
					if (!embedGrid) return buildEmbed()

					if (embedObj.color || embedObj.color == 0) embedGrid.style.borderColor = typeof embedObj.color == "number" ? "#" + embedObj.color.toString(16).padStart(6, "0") : embedObj.color
					else embedGrid.style.removeProperty("border-color")

					return afterBuilding()
				case "embedDescription":
					const embedDescription = embed?.querySelector(".embedDescription")
					if (!embedDescription) return buildEmbed()

					if (embedObj.description) display(embedDescription, markup(encode(embedObj.description), { replaceEmojis: true, replaceHeaders: true }))
					else hide(embedDescription)

					return externalParsing({ element: embedDescription })
				case "embedThumbnail":
					const embedThumbnailLink = embed?.querySelector(".embedThumbnailLink")
					if (!embedThumbnailLink) return buildEmbed()

					const pre = embed.querySelector(".embedGrid .markup pre")
					if (embedObj.thumbnail?.url) {
						embedThumbnailLink.src = imgProxy(embedObj.thumbnail.url)
						embedThumbnailLink.parentElement.style.display = "block"
						if (pre) pre.style.maxWidth = "90%"
					} else {
						hide(embedThumbnailLink.parentElement)
						pre?.style.removeProperty("max-width")
					}

					return afterBuilding()
				case "embedImage":
					const embedImageLink = embed?.querySelector(".embedImageLink")
					if (!embedImageLink) return buildEmbed()

					if (embedObj.image?.url) {
						embedImageLink.src = imgProxy(embedObj.image.url)
						embedImageLink.parentElement.style.display = "block"
					} else hide(embedImageLink.parentElement)

					return afterBuilding()
				case "embedFooterText":
				case "embedFooterIcon":
				case "embedFooterTimestamp":
					const embedFooter = embed?.querySelector(".embedFooter")
					if (!embedFooter) return buildEmbed()

					if (embedObj.footer?.text || embedObj.timestamp) display(embedFooter,
						(embedObj.footer.icon_url ? "<img class='embedFooterIcon embedFooterIcon' src='" + imgProxy(embedObj.footer.icon_url) + "'>" : "") + "<span class='embedFooterText'>" +
						encode(embedObj.footer.text) + (embedObj.timestamp ? "<span class='embedFooterSeparator'>•</span>" + encode(timestamp(embedObj.timestamp)) : "") + "</span></div>", "flex")
					else hide(embedFooter)

					return externalParsing({ element: embedFooter })

				case "componentLabel":
					(componentElem.getElementsByTagName("span")[0] || componentElem.getElementsByTagName("a")[0]).textContent = componentObj.label

					return afterBuilding()
				case "componentPlaceholder":
					componentElem.getElementsByTagName("span")[0].textContent = componentObj.placeholder

					return afterBuilding()
				case "componentStyle":
					componentElem.classList.remove("b-" + buttonStyles[componentElem.dataset.style])
					componentElem.classList.add("b-" + buttonStyles[componentObj.style])
					componentElem.dataset.style = componentObj.style

					return afterBuilding()
				case "componentEmoji":
					if (/^[0-9]{17,21}$/.test(componentObj.emoji.id || componentObj.emoji)) {
						const emojiElement = document.createElement("img")
						emojiElement.classList.add("button-emoji")
						emojiElement.src = "https://cdn.discordapp.com/emojis/" + encode(componentObj.emoji.id || componentObj.emoji) + ".webp?size=16"
						emojiElement.crossOrigin = "anonymous"

						const existingElem = componentElem.getElementsByClassName("button-emoji")[0]
						if (existingElem) componentElem.replaceChild(emojiElement, existingElem)
						else componentElem.insertBefore(emojiElement, componentElem.firstChild)
					} else if (componentObj.emoji.name) {
						const emojiElement = document.createElement("span")
						emojiElement.classList.add("button-emoji")
						emojiElement.textContent = componentObj.emoji.name

						const existingElem = componentElem.getElementsByClassName("button-emoji")[0]
						if (existingElem) componentElem.replaceChild(emojiElement, existingElem)
						else componentElem.insertBefore(emojiElement, componentElem.firstChild)
					} else componentElem.getElementsByClassName("button-emoji")[0]?.remove()

					return afterBuilding()
				case "componentUrl":
					if (componentObj.disabled) {
						componentElem.removeAttribute("title")
						componentElem.getElementsByTagName("a")[0].removeAttribute("href")
					} else {
						componentElem.title = encode(url(componentObj.url))
						componentElem.getElementsByTagName("a")[0].href = encode(url(componentObj.url))
					}

					return afterBuilding()
				case "componentDisabled":
					componentElem.disabled = componentObj.disabled

					if (componentElem.getElementsByTagName("a")[0]) {
						if (componentObj.disabled) {
							componentElem.removeAttribute("title")
							componentElem.getElementsByTagName("a")[0].removeAttribute("href")
						} else {
							componentElem.title = encode(url(componentObj.url))
							componentElem.getElementsByTagName("a")[0].href = encode(url(componentObj.url))
						}
					}

					return afterBuilding()
			}

			embedCont.innerHTML = ""
			if (jsonObject.embeds) for (const currentObj of jsonObject.embeds) {
				const embedElement = embedCont.appendChild(embedFragment.firstChild.cloneNode(true))
				const embedGrid = embedElement.querySelector(".embedGrid")
				const embedTitle = embedElement.querySelector(".embedTitle")
				const embedDescription = embedElement.querySelector(".embedDescription")
				const embedAuthor = embedElement.querySelector(".embedAuthor")
				const embedFooter = embedElement.querySelector(".embedFooter")
				const embedImage = embedElement.querySelector(".embedImage > img")
				const embedThumbnail = embedElement.querySelector(".embedThumbnail > img")
				const embedFields = embedElement.querySelector(".embedFields")

				if (currentObj.title) display(embedTitle, markup(
					currentObj.url ? "<a class='anchor' href='" + encode(url(currentObj.url)) + "' target='_blank' rel='noopener'>" + encode(currentObj.title) + "</a>" : encode(currentObj.title),
					{ replaceEmojis: true, inlineBlock: true }
				))
				else hide(embedTitle)

				if (currentObj.description) display(embedDescription, markup(encode(currentObj.description), { replaceEmojis: true, replaceHeaders: true }))
				else hide(embedDescription)

				if (currentObj.color) embedGrid.closest(".embed").style.borderColor = typeof currentObj.color == "number" ? "#" + currentObj.color.toString(16).padStart(6, "0") : currentObj.color
				else embedGrid.closest(".embed").style.removeProperty("border-color")

				if (currentObj.author?.name) display(embedAuthor,
					(currentObj.author.icon_url ? "<img class='embedAuthorIcon embedAuthorIcon' src='" + imgProxy(currentObj.author.icon_url) + "'>" : "") +
					(currentObj.author.url ? "<a class='embedAuthorNameLink embedLink embedAuthorName' href='" + encode(url(currentObj.author.url)) + "' target='_blank' rel='noopener'>" +
					encode(currentObj.author.name) + "</a>" : "<span class='embedAuthorName'>" + encode(currentObj.author.name) + "</span>"), "flex")
				else hide(embedAuthor)

				const pre = embedGrid.querySelector(".markup pre")
				if (currentObj.thumbnail?.url) {
					embedThumbnail.src = imgProxy(currentObj.thumbnail.url)
					embedThumbnail.parentElement.style.display = "block"
					if (pre) pre.style.maxWidth = "90%"
				} else {
					hide(embedThumbnail.parentElement)
					if (pre) pre.style.removeProperty("max-width")
				}

				if (currentObj.image?.url) {
					embedImage.src = imgProxy(currentObj.image.url)
					embedImage.parentElement.style.display = "block"
				} else hide(embedImage.parentElement)

				if (currentObj.footer?.text) display(embedFooter,
					(currentObj.footer.icon_url ? "<img class='embedFooterIcon embedFooterIcon' src='" + imgProxy(currentObj.footer.icon_url) + "'>" : "") +
					"<span class='embedFooterText'>" + encode(currentObj.footer.text) +
					(currentObj.timestamp ? "<span class='embedFooterSeparator'>•</span>" + encode(timestamp(currentObj.timestamp)) : "") + "</span></div>", "flex")
				else if (currentObj.timestamp) display(embedFooter, "<span class='embedFooterText'>" + encode(timestamp(currentObj.timestamp)) + "</span></div>", "flex")
				else hide(embedFooter)

				if (currentObj.fields) createEmbedFields(currentObj.fields, embedFields)
				else hide(embedFields)

				document.body.classList.remove("emptyEmbed")
				externalParsing()

				if (embedElement.textContent.trim() || embedElement.querySelector(".embedGrid > [style*=display] img"))
					embedElement.classList.remove("emptyEmbed")
				else embedElement.classList.add("emptyEmbed")
			}

			actionRowCont.innerHTML = ""
			if (jsonObject.components) for (const actionRow of jsonObject.components) {
				const actionRowElement = actionRowCont.appendChild(actionRowFragment.firstChild.cloneNode(true))

				if (actionRow.components) for (const component of actionRow.components) {
					if (component.type == 2 && component.style == 5) {
						const buttonElement = document.createElement("button")
						buttonElement.classList.add("b-" + buttonStyles[component.style])
						buttonElement.dataset.style = component.style
						buttonElement.title = encode(url(component.url))

						if (component.disabled) buttonElement.disabled = true

						buttonElement.innerHTML =
							"<a href='" + (component.disabled ? "" : encode(url(component.url))) + "' target='_blank' rel='noopener'>" +
							encode(component.label) + "</a>" +
							// From Discord's client source code
							"<svg aria-hidden='true' role='img' width='16' height='16' viewBox='0 0 24 24'>" +
							"<path fill='currentColor' d='M10 5V3H5.375C4.06519 3 3 4.06519 3 5.375V18.625C3 " +
							"19.936 4.06519 21 5.375 21H18.625C19.936 21 21 19.936 21 18.625V14H19V19H5V5H10Z'></path>" +
							"<path fill='currentColor' d='M21 2.99902H14V4.99902H17.586L9.29297 13.292L10.707 14.706L19 6.41302V9.99902H21V2.99902Z'></path></svg>"

						actionRowElement.appendChild(buttonElement)
					} else {
						const buttonElement = document.createElement("button")

						if (component.type != 3 && !(component.type >= 5 && component.type <= 8)) {
							buttonElement.classList.add("b-" + buttonStyles[component.style])
							buttonElement.dataset.style = component.style
						}

						if (component.disabled) buttonElement.disabled = true
						if (component.custom_id) buttonElement.dataset.custom_id = component.custom_id
						if (component.emoji && component.type != 3 && !(component.type >= 5 && component.type <= 8)) {
							let emojiElement
							if (/^[0-9]{17,21}$/.test(component.emoji.id || component.emoji)) {
								emojiElement = document.createElement("img")
								emojiElement.classList.add("button-emoji")
								emojiElement.src = "https://cdn.discordapp.com/emojis/" + encode(component.emoji.id || component.emoji) + ".webp?size=16"
								emojiElement.crossOrigin = "anonymous"
							} else if (component.emoji.name) {
								emojiElement = document.createElement("span")
								emojiElement.classList.add("button-emoji")
								emojiElement.textContent = component.emoji.name
							}
							if (emojiElement) buttonElement.appendChild(emojiElement)
						}
						if (component.label && component.type != 3 && !(component.type >= 5 && component.type <= 8)) {
							const label = document.createElement("span")
							label.textContent = component.label
							buttonElement.appendChild(label)
						}

						if (component.type == 3 || (component.type >= 5 && component.type <= 8)) {
							buttonElement.classList.add("select")
							buttonElement.innerHTML = "<span>" + encode(component.placeholder) + "</span>" +
								"<svg aria-hidden='true' role='img' width='24' height='24' viewBox='0 0 24 24'>" +
								"<path fill='currentColor' d='M16.59 8.59003L12 13.17L7.41 8.59003L6 10L12 16L18 10L16.59 8.59003Z'></path></svg>"
						}

						actionRowElement.appendChild(buttonElement)
					}
				}
			}

			if (jsonObject.sticker_items && jsonObject.sticker_items.length > 0) {
				let stickerHTML = ""
				for (const sticker of jsonObject.sticker_items) {
					if (sticker.format_type == 3) stickerHTML += "<i>Animated Lottie stickers aren't rendered in the preview.</i>"
					else stickerHTML += "<img src='https://media.discordapp.net/stickers/" + encode(sticker.id) + "." +
						(sticker.format_type == 4 ? "gif" : "png") + "?size=160' width='160' height='160' alt='Sticker: " + encode(sticker.name) + "' crossorigin='anonymous'>"
				}
				document.getElementById("stickerItems").innerHTML = stickerHTML
			} else document.getElementById("stickerItems").innerHTML = ""

			afterBuilding()
		} catch (e) {
			console.error(e)
			error(e)
		}
	}

	const smallerScreen = matchMedia("(max-width: 1015px)")
	// Renders the GUI editor with json data from 'jsonObject'.
	const buildGui = (object = jsonObject) => {
		gui.innerHTML = ""

		for (const child of Array.from(guiFragment.childNodes)) {
			if (child.classList?.[1] == "content")
				gui.insertBefore(gui.appendChild(child.cloneNode(true)), gui.appendChild(child.nextElementSibling.cloneNode(true))).nextElementSibling.firstElementChild.value = object.content || ""
			else if (child.classList?.[1] == "guiEmbedName") {
				for (const [i, embed] of (object.embeds || []).entries()) {
					const guiEmbedName = gui.appendChild(child.cloneNode(true))
					guiEmbedName.removeAttribute("hidden")

					guiEmbedName.querySelector(".text").innerHTML = "Embed " + (i + 1) + (embed.title ? ": <span>" + embed.title + "</span>" : "")
					guiEmbedName.querySelector(".icon").addEventListener("click", () => {
						object.embeds.splice(i, 1)
						buildGui()
						buildEmbed()
					})

					const guiEmbed = gui.appendChild(createElement({ div: { className: "guiEmbed" } }))

					for (const child2 of Array.from(child.nextElementSibling.children)) {
						if (!child2?.classList.contains("edit")) {
							const row = guiEmbed.appendChild(child2.cloneNode(true))
							const edit = child2.nextElementSibling?.cloneNode(true)
							if (edit?.classList.contains("edit")) guiEmbed.appendChild(edit)

							switch (child2.classList[1]) {
								case "author":
									const authorUrl = embed?.author?.icon_url || ""
									if (authorUrl) edit.querySelector(".imgParent").style.content = "url(" + imgProxy(authorUrl) + ")"
									edit.querySelector(".editAuthorName").value = embed?.author?.name || ""
									edit.querySelector(".editAuthorIcon").value = authorUrl
									edit.querySelector(".editAuthorUrl").value = embed?.author?.url || ""
									break
								case "title":
									row.querySelector(".editTitle").value = embed?.title || ""
									break
								case "url":
									row.querySelector(".editUrl").value = embed?.url || ""
									break
								case "color":
									row.querySelector(".editColor").value = embed && embed.color ? (typeof embed.color == "number" ? "#" + embed.color.toString(16).padStart(6, "0") : embed.color) : ""
									break
								case "description":
									edit.querySelector(".editDescription").value = embed?.description || ""
									break
								case "thumbnail":
									const thumbnailUrl = embed?.thumbnail?.url || ""
									if (thumbnailUrl) edit.querySelector(".imgParent").style.content = "url(" + imgProxy(thumbnailUrl) + ")"
									edit.querySelector(".editThumbnailLink").value = thumbnailUrl
									break
								case "image":
									const imageUrl = embed?.image?.url || ""
									if (imageUrl) edit.querySelector(".imgParent").style.content = "url(" + imgProxy(imageUrl) + ")"
									edit.querySelector(".editImageLink").value = imageUrl
									break
								case "footer":
									const footerUrl = embed?.footer?.icon_url || ""
									if (footerUrl) edit.querySelector(".imgParent").style.content = "url(" + imgProxy(footerUrl) + ")"
									edit.querySelector(".editFooterText").value = embed?.footer?.text || ""
									edit.querySelector(".editFooterIcon").value = footerUrl
									break
								case "fields":
									for (const f of embed?.fields || []) {
										const field = edit.querySelector(".fields").appendChild(createElement({ div: { className: "field" } }))

										for (const child3 of Array.from(fieldFragment.firstChild.children)) {
											const newChild = field.appendChild(child3.cloneNode(true))

											if (child.classList.contains("inlineCheck"))
												newChild.querySelector("input").checked = Boolean(f.inline)
											else if (f.value && child3.classList?.contains("fieldInner")) {
												newChild.querySelector(".designerFieldName input").value = f.name || ""
												newChild.querySelector(".designerFieldValue textarea").value = f.value || ""
											}
										}
									}
									break
							}
						}
					}
				}
			} else if (child.classList?.[1] == "guiActionRowName") {
				for (const [i, component] of (object.components || []).entries()) {
					const guiActionRowName = gui.appendChild(child.cloneNode(true))
					guiActionRowName.removeAttribute("hidden")

					guiActionRowName.querySelector(".text").innerHTML = "Action Row " + (i + 1) + (component.custom_id ? ": <span>" + component.custom_id + "</span>" : "")
					guiActionRowName.querySelector(".icon").addEventListener("click", () => {
						object.components.splice(i, 1)
						buildGui()
						buildEmbed()
					})

					const guiActionRow = gui.appendChild(createElement({ div: { className: "guiActionRow" } }))
					const guiActionRowTemplate = child.nextElementSibling

					for (const child2 of Array.from(guiActionRowTemplate.children)) {
						if (child2 && child2.classList.contains("guiComponent")) {
							for (const f of component?.components || []) {
								const edit = child2.cloneNode(true)
								guiActionRow.appendChild(edit)

								const componentElem = edit.querySelector(".componentInner").appendChild(createElement({ div: { className: "button" } }))
								const templateChildren = Array.from(componentFragment.querySelector(".edit .component" + (f.type == 2 ? "Button" : "Select") + "Template").children)

								for (const child3 of templateChildren) {
									const newChild = componentElem.appendChild(child3.cloneNode(true))

									if (newChild.classList.contains("disableCheck")) newChild.querySelector("input").checked = Boolean(f.disabled)
									else if (newChild.classList.contains("custom_id")) newChild.querySelector(".custom_id input").value = f?.custom_id || ""
									else if (newChild.classList.contains("label")) newChild.querySelector(".label input").value = f?.label || ""
									else if (newChild.classList.contains("placeholder")) newChild.querySelector(".placeholder input").value = f?.placeholder || ""
									else if (newChild.classList.contains("editComponentStyle")) newChild.value = f?.style || 1
									else if (newChild.classList.contains("url")) newChild.querySelector(".url input").value = f?.url || ""
									else if (newChild.classList.contains("emoji")) newChild.querySelector(".emoji input").value = f?.emoji?.id || f?.emoji?.name || ""
								}
							}
						}
					}

					guiActionRow.appendChild(guiActionRowTemplate.querySelector(".addComponent").cloneNode(true))
				}
			}
		}

		const addComponentClickListener = e => {
			e.addEventListener("click", () => {
				if (e?.classList.contains("active")) {
					if (getSelection().anchorNode != e) e.classList.remove("active")
				} else if (e) {
					const inlineField = e.closest(".inlineField")
					const input = e.nextElementSibling?.querySelector("input[type='text']")
					const txt = e.nextElementSibling?.querySelector("textarea")

					e.classList.add("active")
					if (e.classList.contains("guiEmbedName")) return changeLastActiveGuiEmbed(guiEmbedIndex(e))

					else if (inlineField) inlineField.querySelector(".ttle~input").focus()

					else if (e.classList.contains("footer")) {
						const date = new Date(jsonObject.embeds[guiEmbedIndex(e)]?.timestamp || new Date())
						const textElement = e.nextElementSibling.querySelector("svg>text")
						textElement.textContent = ("" + date.getDate()).padStart(2, 0)
						textElement.closest(".footerDate").querySelector("input").value = date.toISOString().substring(0, 19)
					} else if (input) {
						if (!smallerScreen.matches) input.focus()
						input.selectionStart = input.value.length
						input.selectionEnd = input.value.length
					} else if (txt && !smallerScreen.matches) txt.focus()

					if (e.classList.contains("fields")) {
						if (reverseColumns && smallerScreen.matches) return e.parentNode.scrollTop = e.offsetTop

						e.scrollIntoView({ behavior: "smooth", block: "center" })
					}
				}
			})
		}
		for (const e of document.querySelectorAll(".top > .gui .item")) addComponentClickListener(e)

		// Scroll into view when tabs are opened in the GUI.
		const lastTabs = new Set(Array.from(document.querySelectorAll(".footer.rows2, .image.largeImg")))
		const requiresView = matchMedia(smallerScreen.media + ", (max-height: 845px)")
		const addGuiEventListeners = () => {
			for (const e of document.querySelectorAll(".gui .item:not(.fields)"))
				e.onclick = () => {
					if (lastTabs.has(e) || requiresView.matches) {
						if (!reverseColumns || !smallerScreen.matches)
							e.scrollIntoView({ behavior: "smooth", block: "center" })
						else if (e.nextElementSibling.classList.contains("edit") && e.classList.contains("active"))
							e.parentNode.scrollTop = e.offsetTop
					}
				}

			for (const e of document.querySelectorAll(".addField"))
				e.onclick = () => {
					const guiEmbed = e.closest(".guiEmbed")
					const indexOfGuiEmbed = Array.from(gui.querySelectorAll(".guiEmbed")).indexOf(guiEmbed)
					if (indexOfGuiEmbed == -1) return error("Could not find the embed to add the field to.")

					if (!jsonObject.embeds) jsonObject.embeds = []
					const guiEmbedObj = jsonObject.embeds[indexOfGuiEmbed] || {}
					if (guiEmbedObj.fields && guiEmbedObj.fields.length >= 25) return error("An embed cannot have more than 25 fields!")
					if (guiEmbedObj.fields) guiEmbedObj.fields.push({ name: "Field name", value: "Field value", inline: false })
					else guiEmbedObj.fields = [{ name: "Field name", value: "Field value", inline: false }]

					const newField = guiEmbed?.querySelector(".item.fields + .edit > .fields")?.appendChild(fieldFragment.firstChild.cloneNode(true))

					buildEmbed()
					addGuiEventListeners()

					newField.scrollIntoView({ behavior: "smooth", block: "center" })
					if (!smallerScreen.matches) {
						const firstInput = newField.querySelector(".designerFieldName input")
						if (firstInput) {
							firstInput.setSelectionRange(firstInput.value.length, firstInput.value.length)
							firstInput.focus()
						}
					}
				}

			for (const e of document.querySelectorAll(".addComponent"))
				e.onclick = () => {
					const guiActionRow = e.closest(".guiActionRow")
					const indexOfGuiActionRow = Array.from(gui.querySelectorAll(".guiActionRow")).indexOf(guiActionRow)
					if (indexOfGuiActionRow == -1) return error("Could not find the row to add the field to.")

					if (!jsonObject.components) jsonObject.components = []
					const actionRow = jsonObject.components[indexOfGuiActionRow] || {}
					if (actionRow.components && actionRow.components.length >= 5) return error("An action row cannot have more than 5 components!")

					jsonObject.components.push({
						type: 1,
						components: [{
							type: 1,
							custom_id: "",
							label: "",
							style: 1,
							disabled: false
						}]
					})

					const newComponent = guiActionRow.insertBefore(componentFragment.firstChild.cloneNode(true), guiActionRow.querySelector(".addComponent"))
					newComponent.querySelector(".edit .componentButtonTemplate").removeAttribute("hidden")

					buildEmbed()
					addGuiEventListeners()
					for (const item of newComponent.querySelectorAll(".top > .gui .item")) addComponentClickListener(item)

					newComponent.scrollIntoView({ behavior: "smooth", block: "center" })
					if (!smallerScreen.matches) {
						const firstInput = newComponent.querySelector(".editComponentLabel")
						if (firstInput) {
							firstInput.setSelectionRange(firstInput.value.length, firstInput.value.length)
							firstInput.focus()
						}
					}
				}

			for (const e of document.querySelectorAll(".fields .field .removeBtn"))
				e.onclick = () => {
					const embedIndex = guiEmbedIndex(e)
					const fieldIndex = Array.from(e.closest(".fields").children).indexOf(e.closest(".field"))

					if (jsonObject.embeds[embedIndex]?.fields[fieldIndex] == -1) return error("Failed to the field to remove.")

					jsonObject.embeds[embedIndex].fields.splice(fieldIndex, 1)

					buildEmbed()
					e.closest(".field").remove()
				}

			for (const e of document.querySelectorAll(".guiActionRow .guiComponent .removeBtn"))
				e.onclick = () => {
					const rowIndex = guiActionRowIndex(e)
					const componentIndex = Array.from(e.closest(".guiActionRow").children).indexOf(e.closest(".guiComponent"))

					if (jsonObject.components[rowIndex]?.components[componentIndex] == -1) return error("Failed to find the component to remove.")

					jsonObject.components[rowIndex].components.splice(componentIndex, 1)

					buildEmbed()
					e.closest(".guiComponent").remove()
				}

			for (const e of gui.querySelectorAll("textarea, input, select"))
				e.oninput = el => {
					const value = el.target.value
					const index = guiEmbedIndex(el.target)
					const field = el.target.closest(".field")

					const embedObj = jsonObject.embeds?.[index] || {}

					if (field) {
						const fieldIndex = Array.from(field.closest(".fields").children).indexOf(field)
						const jsonField = embedObj.fields?.[fieldIndex]

						if (jsonField) {
							if (el.target.type == "text") jsonField.name = value
							else if (el.target.type == "textarea") jsonField.value = value
							else jsonField.inline = el.target.checked
							createEmbedFields(embedObj.fields, document.querySelectorAll(".container > .embed")[index]?.querySelector(".embedFields"))
						}
					} else {
						const rowindex = guiActionRowIndex(el.target)
						const componentindex = guiComponentIndex(el.target)
						const actionRowObj = jsonObject.components && rowindex >= 0 ? jsonObject.components[rowindex] ??= {} : {}
						const componentObj = actionRowObj.components && actionRowObj.components[componentindex] ? actionRowObj.components[componentindex] : {}

						switch (el.target.classList?.[0]) {
							case "editContent":
								jsonObject.content = value
								buildEmbed({ only: "content" })
								break

							case "editAuthorName":
								if (!embedObj.author) embedObj.author = {}
								embedObj.author.name = value
								buildEmbed({ only: "embedAuthorName", index: guiEmbedIndex(el.target) })
								break
							case "editAuthorUrl":
								if (!embedObj.author) embedObj.author = {}
								embedObj.author.url = value
								buildEmbed({ only: "editAuthorUrl", index: guiEmbedIndex(el.target) })
								break
							case "editAuthorIcon":
								if (!embedObj.author) embedObj.author = {}
								embedObj.author.icon_url = value
								imgSrc(el.target.previousElementSibling, value)
								buildEmbed({ only: "editAuthorIcon", index: guiEmbedIndex(el.target) })
								break
							case "editTitle":
								embedObj.title = value
								const guiEmbedName = el.target.closest(".guiEmbed")?.previousElementSibling
								if (guiEmbedName?.classList.contains("guiEmbedName"))
									guiEmbedName.querySelector(".text").innerHTML = guiEmbedName.textContent.split(":")[0] + (value ? ": <span>" + value + "</span>" : "")
								buildEmbed({ only: "embedTitle", index: guiEmbedIndex(el.target) })
								break
							case "editUrl":
								embedObj.url = value
								buildEmbed({ only: "embedUrl", index: guiEmbedIndex(el.target) })
								break
							case "editColor":
								embedObj.color = Number.parseInt(value.replace("#", ""), 16) || 0
								buildEmbed({ only: "embedColor", index: guiEmbedIndex(el.target) })
								break
							case "editDescription":
								embedObj.description = value
								buildEmbed({ only: "embedDescription", index: guiEmbedIndex(el.target) })
								break
							case "editThumbnailLink":
								if (!embedObj.thumbnail) embedObj.thumbnail = {}
								embedObj.thumbnail.url = value
								imgSrc(el.target.closest(".editIcon").querySelector(".imgParent"), value)
								buildEmbed({ only: "embedThumbnail", index: guiEmbedIndex(el.target) })
								break
							case "editImageLink":
								if (!embedObj.image) embedObj.image = {}
								embedObj.image.url = value
								imgSrc(el.target.closest(".editIcon").querySelector(".imgParent"), value)
								buildEmbed({ only: "embedImageLink", index: guiEmbedIndex(el.target) })
								break
							case "editFooterText":
								if (!embedObj.footer) embedObj.footer = {}
								embedObj.footer.text = value
								buildEmbed({ only: "embedFooterText", index: guiEmbedIndex(el.target) })
								break
							case "editFooterIcon":
								if (!embedObj.footer) embedObj.footer = {}
								embedObj.footer.icon_url = value
								imgSrc(el.target.previousElementSibling, value)
								buildEmbed({ only: "embedFooterIcon", index: guiEmbedIndex(el.target) })
								break
							case "embedFooterTimestamp":
								const date = new Date(value)
								if (Number.isNaN(date.getTime())) return error("Invalid date")

								embedObj.timestamp = date.getTime()
								el.target.parentElement.querySelector("svg > text").textContent = (date.getDate() + "").padStart(2, 0)
								buildEmbed({ only: "embedFooterTimestamp", index: guiEmbedIndex(el.target) })
								break

							case "editComponentLabel":
								componentObj.label = value
								buildEmbed({ only: "componentLabel", index: guiActionRowIndex(el.target), componentIndex: guiComponentIndex(el.target) })
								break
							case "editComponentPlaceholder":
								componentObj.placeholder = value
								buildEmbed({ only: "componentPlaceholder", index: guiActionRowIndex(el.target), componentIndex: guiComponentIndex(el.target) })
								break
							case "editComponentStyle":
								componentObj.style = Number.parseInt(value)
								buildEmbed({ only: "componentStyle", index: guiActionRowIndex(el.target), componentIndex: guiComponentIndex(el.target) })
								break
							case "editComponentEmoji":
								componentObj.emoji = value
								buildEmbed({ only: "componentEmoji", index: guiActionRowIndex(el.target), componentIndex: guiComponentIndex(el.target) })
								break
							case "editComponentUrl":
								if (!value.startsWith("http://") && !value.startsWith("https://")) return error("Invalid URI protocol, Discord only supports HTTP and HTTPS.", "3s")

								componentObj.url = value
								buildEmbed({ only: "componentUrl", index: guiActionRowIndex(el.target), componentIndex: guiComponentIndex(el.target) })
								break
							case "disableCheck":
								componentObj.disabled = el.target.checked
								buildEmbed({ only: "componentDisabled", index: guiActionRowIndex(el.target), componentIndex: guiComponentIndex(el.target) })
								break
						}

						if (jsonObject.embeds) jsonObject.embeds = jsonObject.embeds.filter(o => Object.keys(o).length > 0)
						if (jsonObject.components) jsonObject.components = jsonObject.components.filter(o => Object.keys(o).length > 0)
					}

					// Display embed elements hidden due to not having content. '.msgEmbed > .container' is embed container.
					document.querySelectorAll(".msgEmbed > .container")[guiEmbedIndex(el.target)]?.querySelector(".emptyEmbed")?.classList.remove("emptyEmbed")
				}

			for (const browse of document.querySelectorAll(".browse"))
				browse.onclick = () => {
					const fileInput = createElement({ input: { type: "file", accept: "image/*" } })
					const edit = browse.closest(".edit")

					fileInput.onchange = el => {
						if (el.target.files[0].size > 25 * 1024 * 1024)
							return uploadError("File is too large. Maximum size is 25 MiB.", browse)
						browse.classList.add("loading")

						const formData = new FormData()
						formData.append("expiration", 60 * 60 * 24 * 7) // Expire after 7 days
						formData.append("key", "247664c78b4606093dc9a510037483e0")
						formData.append("image", el.target.files[0])

						fetch("https://api.imgbb.com/1/upload", {
							method: "POST",
							body: formData
						}).then(res => res.json())
							.then(res => {
								browse.classList.remove("loading")
								if (!res.success) {
									console.log("Upload failed:", res.data?.error || res.error?.message || res)
									return uploadError(res.data?.error || res.error?.message || "Request failed. (Check dev-console)", browse)
								}

								imgSrc(edit.querySelector(".editIcon > .imgParent"), res.data.url)
								const linkInput = edit.querySelector("input[type=text]")
								const textInput = edit.querySelector("input[class$=Name], input[class$=Text]")

								linkInput.value = res.data.url
								// focus on the next empty input if the field requires a name or text to display eg. footer or author.
								if (!textInput?.value) textInput?.focus()

								console.info(res.data.url + " will be deleted in seven days. To delete it now, visit " + res.data.delete_url + " and scroll down to find the delete button.")

								linkInput.dispatchEvent(new Event("input"))
							}).catch(err => {
								browse.classList.remove("loading")
								error("Image upload request failed with: " + err)
							})
					}

					fileInput.click()
				}

			for (const e of document.querySelectorAll(".guiEmbed"))
				e.onclick = () => {
					const guiEmbed = e.closest(".guiEmbed")
					const indexOfGuiEmbed = Array.from(gui.querySelectorAll(".guiEmbed")).indexOf(guiEmbed)
					if (indexOfGuiEmbed == -1) return error("Could not find the embed to add the field to.")

					changeLastActiveGuiEmbed(indexOfGuiEmbed)
				}
			for (const e of document.querySelectorAll(".guiActionRow"))
				e.onclick = () => {
					const guiActionRow = e.closest(".guiActionRow")
					if (!Array.from(gui.querySelectorAll(".guiActionRow")).includes(guiActionRow)) return error("Could not find the action row to add the component to.")
				}

			if (jsonObject.embeds && !jsonObject.embeds[lastActiveGuiEmbedIndex])
				changeLastActiveGuiEmbed(
					jsonObject.embeds[lastActiveGuiEmbedIndex - 1] ?
						lastActiveGuiEmbedIndex - 1 :
						(jsonObject.embeds.length ? 0 : -1)
				)
		}

		addGuiEventListeners()

		if (guiTabs) {
			const tabs = guiTabs.split?.(/, */) || guiTabs
			const bottomKeys = new Set(["footer", "image"])
			const topKeys = new Set(["author", "content"])

			// Deactivate the default activated GUI fields
			for (const e of gui.querySelectorAll(".item:not(.guiEmbedName).active")) e.classList.remove("active")

			// Activate wanted GUI fields
			for (const e of document.querySelectorAll("." + tabs.join(", ."))) e.classList.add("active")

			// Autoscroll GUI to the bottom if necessary.
			if (!tabs.some(item => topKeys.has(item)) && tabs.some(item => bottomKeys.has(item))) {
				const gui2 = document.querySelector(".top .gui")
				gui2.scrollTo({top: gui2.scrollHeight})
			}
		} else for (const clss of document.querySelectorAll(".item.author, .item.description"))
			clss.classList.add("active")
	}

	buildGui(jsonObject)
	gui.classList.remove("hidden")

	editor.on("change", edi => {
		// If the editor value is not set by the user, return.
		if (JSON.stringify(jsonObject, null, "\t") == edi.getValue()) return

		try {
			// Autofill when " is typed on new line
			const line = edi.getCursor().line
			const text = edi.getLine(line)

			if (text.trim() == "\"") {
				edi.replaceRange(text.trim() + ":", { line, ch: line.length })
				edi.setCursor(line, text.length)
			}

			jsonObject = JSON.parse(edi.getValue())
			buildEmbed()
		} catch {
			if (edi.getValue()) return
			document.body.classList.add("emptyEmbed")
			messageContent.innerHTML = ""
		}
	})

	document.querySelector(".timeText").textContent = timestamp()
	setTimeout(() => {
		document.querySelector(".timeText").textContent = timestamp()
		setInterval(() => document.querySelector(".timeText").textContent = timestamp(), 60000)
	}, 60000 - Date.now() % 60000)

	for (const block of document.querySelectorAll(".markup pre > code")) hljs.highlightElement(block)

	document.getElementById("guiEmbedAdd").addEventListener("click", () => {
			if (!jsonObject.embeds) jsonObject.embeds = []
			if (jsonObject.embeds.length >= 10) return error("You can only have up to 10 embeds!")
			if (indexOfEmptyGuiEmbed("(empty embed)") != -1) return
			jsonObject.embeds.push({})
			buildGui()
		})
	document.getElementById("guiActionRowAdd").addEventListener("click", () => {
			if (!jsonObject.components) jsonObject.components = []
			if (jsonObject.components.length >= 5) return error("You can only have up to 5 action rows!")
			jsonObject.components.push({})
			buildGui()
		})

	document.querySelector(".opt.gui").addEventListener("click", () => {
		if (lastGuiJson && lastGuiJson != JSON.stringify(jsonObject, null, "\t")) buildGui()
		lastGuiJson = void 0

		document.body.classList.add("gui")
		document.getElementById("addContainer").classList.remove("hidden-imp")
	})

	document.querySelector(".opt.json").addEventListener("click", () => {
		const emptyEmbedIndex = indexOfEmptyGuiEmbed(false)
		if (emptyEmbedIndex != -1)
			// Clicked GUI tab while a blank embed is added from GUI.
			return error(gui.querySelectorAll(".item.guiEmbedName")[emptyEmbedIndex].textContent.split(":")[0] + " should not be empty.", "3s")

		const jsonStr = JSON.stringify(jsonObject, null, "\t")
		lastGuiJson = jsonStr

		document.body.classList.remove("gui")
		document.getElementById("addContainer").classList.add("hidden-imp")

		editor.setValue(jsonStr == "{}" ? "{\n\t\n}" : jsonStr)
		editor.refresh()
		editor.focus()
	})

	document.getElementById("clear-button").addEventListener("click", () => {
		jsonObject = {}

		buildEmbed()
		buildGui()

		const jsonStr = JSON.stringify(jsonObject, null, "\t")
		editor.setValue(jsonStr == "{}" ? "{\n\t\n}" : jsonStr)

		for (const e of document.querySelectorAll(".gui .item")) e.classList.add("active")

		if (!smallerScreen.matches) document.getElementsByClassName("editContent")[0].focus()
	})

	document.getElementById("webhook-submit").addEventListener("click", async () => {
		const sendParams = []
		if (document.getElementById("webhook-thread-id").value.trim()) sendParams.push("thread_id=" + encodeURIComponent(document.getElementById("webhook-thread-id").value.trim()))
		if (document.getElementById("webhook-thread-name").value.trim()) sendParams.push("thread_name=" + encodeURIComponent(document.getElementById("webhook-thread-name").value.trim()))

		const webhook = document.getElementById("webhook-url").value + (sendParams.length > 0 ? "?" + sendParams.join("&") : "")
		if (webhook.trim().length > 100) {
			const webhookres = await fetch(webhook.startsWith("https://media.guilded.gg/") ? "https://pterodactyl-vsc.tomatocake.workers.dev/?url=" + encodeURIComponent(webhook) : webhook, {
				method: "POST",
				headers: {
					"User-Agent": "TomatoCake TomatenKuchen.com Message Editor",
					"Content-Type": "application/json",
					Accept: "application/json"
				},
				body: JSON.stringify(jsonObject)
			})
			if (!webhookres.ok) {
				console.error(webhookres.status, await webhookres.json())
				return error("Request failed with error: " + webhookres.status + " " + webhookres.statusText)
			}

			error("The message was sent successfully!", "3s")
			document.getElementById("webhook-dialog").close()
		} else error("Invalid or missing webhook URL!")
	})
	document.getElementById("webhook-clear").addEventListener("click", () => {
		document.getElementById("webhook-url").value = ""
		document.getElementById("webhook-thread-id").value = ""
		document.getElementById("webhook-thread-name").value = ""
	})

	for (const elem of document.querySelectorAll("dialog .close")) {
		elem.addEventListener("click", () => elem.closest("dialog").close())
		elem.addEventListener("keydown", e => {
			if (e.key == "Enter") elem.closest("dialog").close()
		})
	}

	const socket = sockette("wss://tk-api.chaoshosting.eu/embedbuilder", {
		onClose: event => {
			console.log("Disconnected!", event)
			error("The connection to the bot has been lost, reload the page to reconnect.", "8s")
		},
		onOpen: event => console.log("Connected!", event),
		onMessage: wsjson => {
			if (wsjson.action == "error") error(wsjson.message, wsjson.time)
			else if (wsjson.action == "result_importcode") alert("Send the code " + wsjson.code + " while replying to the message you want to import. The bot must be able to see the channel!")
			else if (wsjson.action == "result_sendcode") alert("Send the code " + wsjson.code + " in the channel you want to send the message in! (Manage Messages)" +
				"\nYou can optionally reply to a message to make TomatenKuchen edit it. (Manage Guild)\n\nIf you're using the bot embed commands, just paste the code into the popup.")
			else if (wsjson.action == "result_import") {
				jsonObject = wsjson.data
				buildEmbed()
				buildGui()
			} else if (wsjson.action == "result_send") error(wsjson.success ? "The message was sent successfully!" : "The message couldn't be sent: " + wsjson.error)
		}
	})

	if (top == self) {
		if (params.has("dgh") || params.has("mb")) {
			document.getElementById("import-button").remove()
			document.getElementById("sendbot-button").remove()
		} else {
			document.getElementById("import-button").addEventListener("click", () => socket.send(JSON.stringify({action: "import"})))
			document.getElementById("sendbot-button").addEventListener("click", () => {
				socket.send(JSON.stringify({action: "send", data: jsonObject}))
			})
		}
	}

	document.getElementById("copy-button").addEventListener("click", async () => {
		const jsonData = JSON.stringify(jsonObject)
		if (!await navigator.clipboard?.writeText(jsonData).catch(err => console.log("Could not copy to clipboard: " + err.message))) {
			const textarea = document.body.appendChild(document.createElement("textarea"))

			textarea.value = jsonData
			textarea.select()
			textarea.setSelectionRange(0, 50000)
			document.execCommand("copy")
			document.body.removeChild(textarea)
		}
	})

	document.querySelector(".top-btn.menu")?.addEventListener("click", async e => {
		if (e.target.closest(".item.dataLink")) {
			let data = encodeJson(true).replace(/(?<!data=[^=]+|=)=(&|$)/g, x => x == "=" ? "" : "&")
			let shortened = false
			if (data.length > 2000) {
				const shorterres = await fetch("https://sh0rt.zip", {
					method: "POST",
					headers: {
						"User-Agent": "TomatoCake TomatenKuchen.com Message Editor",
						"Content-Type": "application/json",
						Accept: "application/json"
					},
					body: JSON.stringify({
						name: Math.random().toString(36).slice(6),
						url: data,
						date: Date.now() + 1000 * 60 * 60 * 24 * 30
					})
				})
				const shorterjson = await shorterres.json()
				console.log("Response from https://sh0rt.zip:", shorterjson)
				if (shorterres.ok) {
					shortened = true
					data = "https://sh0rt.zip/" + shorterjson.name
				}
			}

			if (top == self) {
				try {
					await navigator.clipboard.writeText(data)
				} catch {
					const input = document.body.appendChild(document.createElement("input"))
					input.value = data
					input.select()
					document.setSelectionRange(0, 30000)
					document.execCommand("copy")
					document.body.removeChild(input)
				}

				setTimeout(() => alert("Copied to clipboard." +
					(shortened ? " The URL was shortened to work on Discord and can now be used for example with the TomatenKuchen \"embed\" command." : "")), 1)
			} else {
				document.getElementById("share-dialog").showModal()
				document.getElementById("share-content").innerHTML = "<a href='" + data + "'>" + data + "</a>" + (data.length > 2000 ? "<br>URL was shortened to work on Discord." : "")
			}

			return
		}

		if (e.target.closest("#send-webhook")) document.getElementById("webhook-dialog").showModal()
		else if (e.target.closest(".item.download"))
			createElement({
				a: {
					download: "tkmessage_" + new Date().toISOString() + ".json", href: "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonObject, null, "\t"))
				}
			}).click()
		else if (e.target.closest(".item.auto")) {
			const input = e.target.closest(".item")?.querySelector("input")
			if (input) input.checked = !input.checked

			e.target.checked = !e.target.checked
			autoUpdateUrl = document.body.classList.toggle("autoUpdateUrl")
			if (autoUpdateUrl) localStorage.setItem("autoUpdateUrl", 1)
			else localStorage.removeItem("autoUpdateUrl")
			urlOptions("data", encodeJson())
		} else if (e.target.closest(".item.theme")) {
			if (document.body.classList.toggle("light")) localStorage.setItem("theme", "light")
			else localStorage.setItem("theme", "dark")
		} else if (e.target.closest(".item.reverse")) {
			reverse(reverseColumns)
			reverseColumns = !reverseColumns

			if (reverseColumns) localStorage.setItem("reverseColumns", 1)
			else localStorage.removeItem("reverseColumns")
		} else e.target.closest(".top-btn")?.classList.toggle("active")
	})

	for (const e of document.getElementsByClassName("img")) {
		if (e.nextElementSibling?.classList.contains("spinner-container"))
			e.addEventListener("error", el => {
				el.target.style.display = "none"
				el.target.nextElementSibling.style.display = "block"
			})
	}

	buildEmbed()

	if (location.protocol != "file:" && "serviceWorker" in navigator) navigator.serviceWorker.register("/serviceworker.js")
})
