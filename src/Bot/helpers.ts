
// Returns a string version of a date that can be easily be sorted in file systems
export function getSortableDate(date: Date = new Date(), includeTime = false) {
  const day = date.toLocaleString("default", { day: "2-digit" })
  const month = date
    .toLocaleString("default", { month: "2-digit" })
    .toLowerCase()
  const year = date.toLocaleString("default", { year: "numeric" })
  const time = date.toLocaleTimeString('en-US')

  if (includeTime) {
    return `${year}_${month}_${day}_${time}`
  }

  return `${year}_${month}_${day}`
}


