/**
 * Encryption I: Caesar Cipher
 *
 * You are attempting to solve a Coding Contract. You have 10 tries remaining,
 * after which the contract will self-destruct.
 *
 * Caesar cipher is one of the simplest encryption technique. It is a type of
 * substitution cipher in which each letter in the plaintext is replaced by a
 * letter some fixed number of positions down the alphabet. For example, with a
 * left shift of 3, D would be replaced by A, E would become B, and A would
 * become X (because of rotation).
 *
 * You are given an array with two elements:
 *    ["CACHE VIRUS CLOUD PASTE DEBUG", 13]
 * The first element is the plaintext, the second element is the left shift
 * value.
 *
 * Return the ciphertext as uppercase string. Spaces remain the same.
 **/

import { CodingContractWrapper } from '/contracts/CodingContractWrapper.js'

/** @param {NS} ns **/
export async function main(ns, file, type, server) {
  const testVal1 = ['abc', 3]
  if (solve(testVal1) !== 'XYZ') {
    ns.print("ERROR: 'abc' should solve to 'XYZ'.")
    ns.print(`ERROR: 'abc' solves to '${solve(testVal1)}'.`)
    ns.exit()
  }
  ns.print("SUCCESS: Test 1 passed. ")
  const testVal2 = ['def xyz', 4]
  if (solve(testVal2) !== 'ZAB TUV') {
    ns.print("ERROR: 'def xyz' should solve to 'ZAB TUV'.")
    ns.print(`ERROR: 'def xyz' solves to '${solve(testVal2)}'.`)
    ns.exit()
  }
  ns.print("SUCCESS: Test 2 passed. ")
  const testVal3 = ['CACHE VIRUS CLOUD PASTE DEBUG', 13]
  const sol3 = 'PNPUR IVEHF PYBHQ CNFGR QROHT'
  if (solve(testVal3) !== sol3) {
    ns.print(`ERROR: '${testVal3}' should solve to '${sol3}'.`)
    ns.print(`ERROR: '${testVal3}' solves to '${solve(testVal3)}'.`)
    ns.exit()
  }
  ns.print("SUCCESS: Test 3 passed. ")
  ns.print("SUCCESS: All tests passed.")

  const codingContractor = new CodingContractWrapper(ns, file, type, server)
  const answer = solve(await codingContractor.extractData())
  await codingContractor.sendSolution(answer)
}

/**
 * @param {string} data
 */
function solve(data) {
  const plaintext = data[0]
  const leftShift = data[1]
  if ( typeof plaintext != 'string' || typeof leftShift != "number")
    return `ERROR: data passed in is formatted incorrectly! ${data}`

  let result = ""
  for (const char of plaintext) {
    const charCode = char.charCodeAt()

    // magic numbers: charCodes 65-90 are A-Z, 97-122 are a-z
    if ((charCode < 65 || charCode > 122) ||
        (charCode > 90 && charCode < 97)) {
      result += char
      continue;
    }

    let rotChar = charCode - leftShift
    if ((charCode <= 90 && rotChar < 65) || (charCode >= 97 && rotChar < 97))
      rotChar += 26
    result += String.fromCharCode(rotChar)
  }
  return result.toUpperCase()
}

