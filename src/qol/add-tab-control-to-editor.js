// source:
// https://raw.githubusercontent.com/PhilipArmstead/BitBurner-Scripts/

/** @param {NS} ns **/
export async function main() {
	if (typeof globalThis.customBoundEvents !== 'object') {
		globalThis.customBoundEvents = {}
	}

	if (globalThis.customBoundEvents.tabber) {
		return
	}

	globalThis.customBoundEvents.tabber = true

	const doc = globalThis['document']
	doc.body.addEventListener('keydown', ({ key, ctrlKey, shiftKey }) => {
		if (key.toLowerCase() === 'tab' && ctrlKey) {
			const tabs = [].slice.call(doc.querySelectorAll('[data-rbd-draggable-context-id] button'))
			const activeTab = tabs.length ? tabs.find((tab) => tab.style.background) : null

			if (activeTab) {
				const tabParent = activeTab.parentElement
				const allTabs = tabParent.parentElement.children
				let nextTab

				if (!shiftKey) {
					nextTab = (tabParent.nextElementSibling ? tabParent.nextElementSibling : allTabs[0]).firstElementChild
				} else {
					nextTab = (tabParent.previousElementSibling ? tabParent.previousElementSibling : [].slice.call(allTabs, -1)[0]).firstElementChild
				}

				nextTab.click()
			}
		}
	})
}
