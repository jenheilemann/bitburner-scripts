// source:
// https://raw.githubusercontent.com/PhilipArmstead/BitBurner-Scripts/

/** @param {NS} ns **/
export async function main (ns) {
	const doc = globalThis["document"]

	applyStyles(doc)

	if (!globalThis.isMinimising) {
		globalThis.isMinimising = true
		setTimeout(() => makeElementsMinimisable(doc), 1000)
	} else {
		console.warn("Minimise monitor is already running")
	}
}


/** @param {HTMLDocument} doc */
function applyStyles (doc) {
	const stylesheetId = "minimisable-styles"
	const existingStylesheet = doc.getElementById(stylesheetId)

	if (existingStylesheet) {
		existingStylesheet.remove()
	}

	doc.firstElementChild.insertAdjacentHTML("beforeend", `
		<style id="${stylesheetId}">
			.MuiPaper-root.MuiPaper-elevation.MuiPaper-rounded.MuiPaper-elevation1.is-minimised + * {
				border: none;
				margin: 0;
				max-height: 0;
				padding: 0;
				pointer-events: none;
				visibility: hidden;
			}
		</style>
	`)
}


/** @param {HTMLDocument} doc */
function makeElementsMinimisable (doc) {
	[].slice.call(
		doc.querySelectorAll(
			".MuiPaper-root.MuiPaper-elevation.MuiPaper-rounded.react-draggable div > .MuiPaper-root.MuiPaper-elevation.MuiPaper-rounded.MuiPaper-elevation1:not([data-can-be-minimised]):first-child")
	).forEach(makeElementMinisable)

	setTimeout(() => makeElementsMinimisable(doc), 1000)
}


/** @param {HTMLElement} element */
function makeElementMinisable (element) {
	if (element.dataset.canBeMinimised) {
		return
	}

	element.removeEventListener("dblclick", minimiseElement)
	element.addEventListener("dblclick", minimiseElement)
}


function minimiseElement () {
	this.classList.toggle("is-minimised")
	this.dataset.canBeMinimised = "true"
}
