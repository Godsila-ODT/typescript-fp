import { pipe } from "fp-ts/lib/function"
import { filterApprove, filterReject, loadCardRequest, validateFileExists } from "./cardApproval"
import { Either, left, match, right } from "fp-ts/lib/Either"
import { ApprovalResult, CardRequest } from "./cardCriteria"

describe('Card Approval', () => {
  it('should return only approved request records', () => {
    const response = [{ "name": "John", "salary": 18000, "hasEmpCert": true, "cardType": "silver" }, { "name": "Mary", "salary": 17500, "hasEmpCert": false, "cardType": "silver" }, { "name": "Peter", "salary": 35000, "hasEmpCert": true, "cardType": "gold" }, { "name": "Jane", "salary": 45000, "hasEmpCert": true, "cardType": "platinum" }, { "name": "Jim", "salary": 32000, "hasEmpCert": true, "cardType": "gold" }, { "name": "Jill", "salary": 22000, "hasEmpCert": false, "cardType": "silver" }, { "name": "Jack", "salary": 33000, "hasEmpCert": true, "cardType": "gold" }, { "name": "Jill", "salary": 40000, "hasEmpCert": false, "cardType": "silver" }, { "name": "Jim", "salary": 32000, "hasEmpCert": true, "cardType": "gold" }, { "name": "Sam", "salary": 60000, "hasEmpCert": true, "cardType": "diamond" }]

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
    ).toEqual(right(response))
  })

  it('should return only rejected request records', () => {
    expect(
      pipe(
        __dirname + "/data/cardRequest.csv",
        validateFileExists,
        loadCardRequest,
        filterReject,
        match<string, CardRequest[], string | CardRequest[]>(
          (e) => e,
          (result) => result
        )
        // file -> Either
        // load card request from file -> Either
        // filter rejected -> Either
      )
    ).toEqual([{ "cardType": undefined, "hasEmpCert": true, "name": "Jill", "salary": 9000 }])
  })

  it('should return left error when file is corrupted', () => {
    expect(
      pipe(
        __dirname + "/data/errorRequest.csv",
        validateFileExists,
        loadCardRequest,
        filterApprove,
        match<string, ApprovalResult[], string | ApprovalResult[]>(
          (e) => e,
          (result) => result
        )
        // file -> Either
        // load card request from file and detect file corrupted -> Either
        // filter approved (let error pass through) -> Either
      )
    ).toEqual('Error: Found unknown reject')
  })
})
