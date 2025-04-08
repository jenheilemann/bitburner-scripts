/**
 * Unique Paths in a Grid II
 *
 * You are located in the top-left corner of the following grid:
 *
 * 0,0,0,0,0,0,1,1,0,
 * 0,1,0,0,0,0,0,1,0,
 * 0,0,0,0,0,1,1,0,0,
 * 0,0,0,0,0,0,0,0,0,
 * 1,0,0,0,0,0,0,0,0,
 * 1,0,0,0,0,1,0,0,0,
 * 1,0,0,1,0,0,0,0,0,
 *
 * You are trying reach the bottom-right corner of the grid, but you can only
 * move down or right on each step. Furthermore, there are obstacles on the
 * grid that you cannot move onto. These obstacles are denoted by '1', while
 * empty spaces are denoted by 0.
 *
 * Determine how many unique paths there are from start to finish.
 *
 * NOTE: The data returned for this contract is an 2D array of numbers
 * representing the grid.
 *
 **/
import { CodingContractWrapper } from '/contracts/CodingContractWrapper.js'

/** @param {NS} ns **/
export async function main(ns, file, type, server) {
  const codingContractor = new CodingContractWrapper(ns, file, type, server)
  const data = await codingContractor.extractData()
  const answer = solve(data)
  await codingContractor.sendSolution(answer)
}

/**
 * @param {array} arr
 * @returns {int}
 **/
export function solve(arr) {
  let grid = new Grid(arr)
  return grid.bottomRight().findNumPaths(grid)
}

class Grid {
  constructor(arr) {
    this.grid = this.initGrid(arr)
    this.width = arr[0].length
    this.height = arr.length
  }

  bottomRight() {
    return this.at(this.width-1, this.height-1)
  }

  at(x, y) {
    return this.grid[`${x},${y}`]
  }

  initGrid(arr) {
    let grid = {}

    arr.forEach((row, y_index) => {
      row.forEach((cell, x_index) => {
        grid[`${x_index},${y_index}`] = new Cell(x_index, y_index, cell)
      })
    })
    return grid
  }

}

class Cell {
  constructor(x, y, isObstacle) {
    this.isObstacle = isObstacle ? true : false
    this.x = x
    this.y = y
    this.paths;
  }

  findNumPaths(grid) {
    if ( this.isObstacle ) {
      return 0
    }

    if ( this.x == 0 && this.y == 0 ) {
      return 1
    }

    let west  = this.x == 0 ? 0 : grid.at(this.x-1, this.y).findNumPaths(grid)
    let north = this.y == 0 ? 0 : grid.at(this.x, this.y-1).findNumPaths(grid)

    return north + west
  }
}
