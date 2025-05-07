/**
 * HammingCodes: Encoded Binary to Integer
 * 
 * You are attempting to solve a Coding Contract. You have 10 tries remaining, 
 * after which the contract will self-destruct.
 * 
 * You are given the following encoded binary string:
 * '1000100011110100'
 * 
 * Decode it as an 'extended Hamming code' and convert it to a decimal value.
 * The binary string may include leading zeroes. A parity bit is inserted at 
 * position 0 and at every position N where N is a power of 2. Parity bits are 
 * used to make the total number of '1' bits in a given set of data even. The 
 * parity bit at position 0 considers all bits including parity bits. Each 
 * parity bit at position 2^N alternately considers 2^N bits then ignores 2^N 
 * bits, starting at position 2^N. The endianness of the parity bits is 
 * reversed compared to the endianness of the data bits: 
 *  - Data bits are encoded most significant bit first and the parity bits 
 *    encoded least significant bit first.
 * The parity bit at position 0 is set last. There is a ~55% chance for an 
 * altered bit at a random index. Find the possible altered bit, fix it and 
 * extract the decimal value.
 * 
 * Examples:
 * 
 *    '11110000' passes the parity checks and has data bits of 1000, which is 8 
 *      in binary.
 *    '1001101010' fails the parity checks and needs the last bit to be 
 *      corrected to get '1001101011', after which the data bits are found to 
 *      be 10101, which is 21 in binary.
 * 
 * For more information on the 'rule' of encoding, refer to Wikipedia 
 * (https://wikipedia.org/wiki/Hamming_code) or the 3Blue1Brown videos on 
 * Hamming Codes. (https://youtube.com/watch?v=X8jsijhllIA)
 */

import { CodingContractWrapper } from '/contracts/CodingContractWrapper.js'

/** @param {NS} ns **/
export async function main(ns, file, type, server) {
  const testVal1 = '11110000'
  if (solve(testVal1) !== 8) {
    ns.tprint("ERROR: '11110000' should solve to 8.")
    ns.exit()
  }
  const testVal2 = '1001101010'
  if (solve(testVal2) !== 21) {
    ns.tprint("ERROR: '1001101010' should solve to 21.")
    ns.exit()
  }
  const testVal3 = '1000100011110100'
  if (solve(testVal3) !== 52) {
    ns.tprint("ERROR: '1000100011110100' should solve to 52.")
    ns.exit()
  }
  ns.print("All tests passed.")

  const codingContractor = new CodingContractWrapper(ns, file, type, server)
  const answer = solve(await codingContractor.extractData())
  await codingContractor.sendSolution(answer)
}

/**
 * @param {string} data
 */
function solve(data) {
  const arr = data.split("")
  const map = arr.reduce((acc, e) => acc.set(e, (acc.get(e) || 0) + 1), new Map())
  if ( map.get('1') % 2 == 1) {
    // there's an error, we should find it
    let pos = 0
    for (let i = 0; i < arr.length; i++) { if (arr[i] == '1') pos = pos ^ i }
    arr[pos] = arr[pos] == '1' ? '0' : '1'
  }
  let idx = 1
  const idxs = [0]
  while( idx < arr.length ) {
    idxs.push(idx)
    idx = idx * 2
  }
  // indexes of parity bits, removing them in reverse order so not to change 
  // higher indicies
  idxs.reverse()
  for (let i of idxs) {
    arr.splice(i,1)
  }
  return parseInt(arr.join(""), 2)
}
