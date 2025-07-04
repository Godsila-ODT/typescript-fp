import { pipe } from "fp-ts/lib/function"
import { filterApprove, filterReject, loadCardRequest, validateFileExists } from "./cardApproval"

describe('Card Approval', () => {
  it('should return only approved request records', () => {
    const response = { "_tag": "Right", "right": [{ "name": "John", "salary": 18000, "hasEmpCert": true, "cardType": "silver" }, { "name": "Mary", "salary": 17500, "hasEmpCert": false, "cardType": "silver" }, { "name": "Peter", "salary": 35000, "hasEmpCert": true, "cardType": "gold" }, { "name": "Jane", "salary": 45000, "hasEmpCert": true, "cardType": "platinum" }, { "name": "Jim", "salary": 32000, "hasEmpCert": true, "cardType": "gold" }, { "name": "Jill", "salary": 22000, "hasEmpCert": false, "cardType": "silver" }, { "name": "Jack", "salary": 33000, "hasEmpCert": true, "cardType": "gold" }, { "name": "Jill", "salary": 40000, "hasEmpCert": false, "cardType": "silver" }, { "name": "Jim", "salary": 32000, "hasEmpCert": true, "cardType": "gold" }, { "name": "Sam", "salary": 60000, "hasEmpCert": true, "cardType": "diamond" }] }

    expect(
      pipe(
        __dirname + "/data/cardRequest.csv",
        validateFileExists,
        loadCardRequest,
        filterApprove,
        // file -> Either
        // load card request from file -> Either
        // filter approved -> Either
      )
    ).toEqual(response)
  })

  it('should return only rejected request records', () => {
    const response = { "_tag": "Right", "right": [{ "cardType": undefined, "hasEmpCert": true, "name": "Jill", "salary": 9000 }] }
    expect(
      pipe(
        __dirname + "/data/cardRequest.csv",
        validateFileExists,
        loadCardRequest,
        filterReject,
        // file -> Either
        // load card request from file -> Either
        // filter rejected -> Either
      )
    ).toEqual(response)
  })

  it('should return left error when file is corrupted', () => {
    const xx = pipe(
      __dirname + "/data/errorRequest.csv",
      validateFileExists,
      loadCardRequest,
      filterApprove,
      // file -> Either
      // load card request from file and detect file corrupted -> Either
      // filter approved (let error pass through) -> Either
    )

    const failResponse = { "_tag": "Left", "left": "Error: Found unknown reject" }
    expect(
      pipe(
        __dirname + "/data/errorRequest.csv",
        validateFileExists,
        loadCardRequest,
        filterApprove,
        // file -> Either
        // load card request from file and detect file corrupted -> Either
        // filter approved (let error pass through) -> Either
      )
    ).toEqual(failResponse)
  })
})
