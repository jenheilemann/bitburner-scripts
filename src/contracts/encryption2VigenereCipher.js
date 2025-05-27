/**
 * Encryption II: Vigenère Cipher
 *
 * You are attempting to solve a Coding Contract. You have 10 tries remaining,
 * after which the contract will self-destruct.
 *
 * Vigenère cipher is a type of polyalphabetic substitution. It uses the
 * Vigenère square to encrypt and decrypt plaintext with a keyword.
 *
 * For encryption each letter of the plaintext is paired with the corresponding
 * letter of a repeating keyword. For example, the plaintext DASHBOARD is
 * encrypted with the keyword LINUX:
 *    Plaintext: DASHBOARD
 *    Keyword:   LINUXLINU
 * So, the first letter D is paired with the first letter of the key L.
 * Therefore, row D and column L of the Vigenère square are used to get the
 * first cipher letter O. This must be repeated for the whole ciphertext.
 *
 * You are given an array with two elements:
 *    ["VIRUSPASTESHELLTABLEINBOX", "HYPERLINK"]
 * The first element is the plaintext, the second element is the keyword.
 *
 * Return the ciphertext as uppercase string.
 **/

import { CodingContractWrapper } from '/contracts/CodingContractWrapper.js'

/** @param {NS} ns **/
export async function main(ns, file, type, server) {
  runTest(ns, ['ABC', 'ABC'], 'ACE')
  runTest(ns, ['TUVW XYZ', 'BACK'], 'UUXG YYB')
  runTest(ns, ['DASH BOARD', 'LINUX'], 'OIFB YZIEX')
  runTest(ns, ['dashboard', 'LINUX'], 'OIFBYZIEX')
  runTest(ns, ['DASHBOARD', 'linux'], 'OIFBYZIEX')
  runTest(ns, ['dashboard', 'linux'], 'OIFBYZIEX')
  ns.print("SUCCESS: All tests passed.")

  const codingContractor = new CodingContractWrapper(ns, file, type, server)
  const answer = solve(await codingContractor.extractData())
  await codingContractor.sendSolution(answer)
}

/**
 * @param {string[]} data
 */
function solve(data) {
  const [text, key] = data.map((v) => v.toUpperCase())
  const keyLength = key.length
  let nonLetterCount = 0
  return text.split("").map((char, i) => {
    const charCode = char.charCodeAt()
    // magic numbers: charCodes 65-90 are A-Z
    // otherwise punctuation/numbers/whitespace, etc
    if (charCode < 65 || charCode > 90){
      ++nonLetterCount
      return char
    }
    const keyCode = key[(i - nonLetterCount) % keyLength].charCodeAt() - 65
    const shifted = (charCode - 65  + keyCode) % 26 + 65
    return String.fromCharCode(shifted)
  }).join("")
}

/**
 * @param {NS} ns
 * @param {any} input
 * @param {string|array} expectedOutput
 **/
function runTest(ns, input, expectedOutput) {
  const solution = solve(input)
  if ( solution != expectedOutput ) {
    ns.print(`ERROR: '${input}' should solve to '${expectedOutput}'`)
    ns.print(`ERROR: '${input}' solves to '${solution}'.`)
    ns.exit()
  }
  ns.print(`SUCCESS: Test ${input} passed.`)
}
