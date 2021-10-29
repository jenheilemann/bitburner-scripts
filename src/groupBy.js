// yoink: https://gist.github.com/robmathers/1830ce09695f759bf2c4df15c29dd22d

/**
 * `data` is an array of objects
 * `key` is the key, property accessor, or callback function to group by
**/
export function groupBy(data, key) {
  // reduce runs this anonymous function on each element of `data`
  // (the `item` parameter, returning the `storage` parameter at the end
  return data.reduce(function(storage, item) {
    // get the first instance of the key by which we're grouping
    var group = key instanceof Function ? key(item) : item[key];

    // set `storage` for this instance of group to the outer scope (if not empty) or initialize it
    storage[group] = storage[group] || [];

    // add this item to its group within `storage`
    storage[group].push(item);

    // return the updated storage to the reduce function,
    //which will then loop through the next
    return storage;
  }, {}); // {} is the initial value of the storage
};
