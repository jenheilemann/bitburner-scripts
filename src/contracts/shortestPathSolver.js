/**
 * Shortest Path in a Grid
 *
 * You are located in the top-left corner of the following grid:
 *
 *   [[0,0,0,0,0,0,0,0,1,0,1,0],
 *    [0,0,1,0,0,0,1,0,0,0,0,1],
 *    [0,0,1,0,1,0,1,0,0,0,0,0],
 *    [0,0,0,0,1,1,0,0,0,0,0,0],
 *    [0,0,0,0,1,1,1,0,0,1,0,0],
 *    [0,0,0,0,0,1,0,0,1,1,0,0],
 *    [0,1,1,0,0,1,0,0,1,0,0,1],
 *    [0,1,0,0,0,0,0,1,1,0,0,0]]
 *
 * You are trying to find the shortest path to the bottom-right corner of the
 * grid, but there are obstacles on the grid that you cannot move onto. These
 * obstacles are denoted by '1', while empty spaces are denoted by 0.
 *
 * Determine the shortest path from start to finish, if one exists. The answer
 * should be given as a string of UDLR characters, indicating the moves along
 * the path.
 *
 * NOTE: If there are multiple equally short paths, any of them is accepted as
 * answer. If there is no path, the answer should be an empty string.
 * NOTE: The data returned for this contract is an 2D array of numbers
 * representing the grid.
 *
 * Examples:
 *
 *     [[0,1,0,0,0],
 *      [0,0,0,1,0]]
 *
 * Answer: 'DRRURRD'
 *
 *     [[0,1],
 *      [1,0]]
 *
 * Answer: ''
 **/

import { CodingContractWrapper } from '/contracts/CodingContractWrapper.js'

/** @param {NS} ns **/
export async function main(ns, file, type, server) {
  const codingContractor = new CodingContractWrapper(ns, file, type, server)
  const answer = solve(await codingContractor.extractData())
  await codingContractor.sendSolution(answer)
}

function solve(data) {
  let grid = new Grid(data)
  return grid.walk()
}

class Grid {
  /**
   * @param {NS} ns
   * @param {[[int]]} map
   */
  constructor(map) {
    this.map = map
    this.path = ''
    this.visited = []
    this.height = map.length
    this.width = map[0].length

    this.start = new Point(0, 0)
    this.end = new Point(this.height - 1, this.width - 1)
  }

  walk() {
    let visited = []
    let toVisit = [this.start]
    let visiting, neighbors
    while (toVisit.length > 0) {
      visiting = toVisit.shift()
      visited.push(visiting)
      if (visiting.equals(this.end))
        return visiting.path

      neighbors = visiting.getNeighbors()
      for (let neighbor of neighbors) {
        if (this.outsideBounds(neighbor))
          continue
        if (this.isWall(neighbor))
          continue
        if (visited.some(v => v.equals(neighbor)))
          continue
        toVisit.push(neighbor)
      }
    }
    return ''
  }

  outsideBounds(point) {
    if ( point.row < 0 || point.col < 0)
      return true
    if ( point.row >= this.height || point.col >= this.width)
      return true
    return false
  }

  isWall(point) {
    return this.map[point.row][point.col] == 1
  }

}

class Point {
  constructor(row, col, path = "") {
    this.row = row
    this.col = col
    this.path = path
  }

  equals(other) {
    return this.row == other.row && this.col == other.col
  }

  getNeighbors() {
    return [
      new Point(this.row - 1, this.col  , this.path + "U"),
      new Point(this.row    , this.col+1, this.path + "R"),
      new Point(this.row + 1, this.col  , this.path + "D"),
      new Point(this.row    , this.col-1, this.path + "L"),
    ]
  }
}
