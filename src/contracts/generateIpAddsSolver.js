/**
 * Generage IP Addresses
 *
 * Given a string containing only digits, return an array with all possible
 * valid IP address combinations that can be created.
 *
 * Note that an octet cannot begin with a '0' unless the number itself is actually
 * 0. For example, '192.168.010.1' is not a valid IP.
 *
 * Examples:
 *
 * 25525511135 -> [255.255.11.135, 255.255.111.35]
 * 1938718066 -> [193.87.180.66]
 **/

import { CodingContractWrapper } from '/contracts/CodingContractWrapper.js'

/** @param {NS} ns **/
export async function main(ns, file, type, server) {
  const codingContractor = new CodingContractWrapper(ns, file, type, server)
  const answer = solve(await codingContractor.extractData())
  await codingContractor.sendSolution(answer)
}

/**
 * @param {string} digits
 * @returns {array string}
 **/
function solve(digits) {
  let permutations = splitPermutations(digits)
  let answer = permutations.filter(val => val.every(octet => validOctet(octet)))

  return answer.map(ip => ip.join('.')).join(',')
}

/**
 * @param {string} octet
 **/
function validOctet(octet) {
  if ( octet.length > 3 )
    return false

  if ( octet.length == 0 )
    return false

  if ( octet.length > 1 && octet[0] == '0' )
    return false

  if ( octet > 255 )
    return false

  return true
}

/**
 * @param {string} digits
 **/
function splitPermutations(digits) {
  let permutations = []

  for (let length1 of [1,2,3]) {
    for (let length2 of [1,2,3]) {
      for (let length3 of [1,2,3]) {
        permutations.push([
          digits.substr(0, length1),
          digits.substr(length1, length2),
          digits.substr(length1+length2, length3),
          digits.substr(length1+length2+length3)
        ])
      }
    }
  }

  return permutations
}
