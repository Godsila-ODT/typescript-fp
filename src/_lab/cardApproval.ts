import { existsSync, readFileSync } from 'fs'
import { pipe } from "fp-ts/lib/function";
import { Either, flatMap, left, right } from "fp-ts/lib/Either";
import { filter } from "fp-ts/lib/Array";
import path from 'path'
import { ApprovalResult, cardCriteria, CardRequest } from './cardCriteria';

type LoadCardRequest = (filePath: Either<string, string>) => Either<string, string[]>
type FilterApprove = (data: Either<string, string[]>) => Either<string, ApprovalResult[]>
type FilterReject = (data: Either<string, string[]>) => Either<string, CardRequest[]>

// start here...

export const validateFileExists = (filePath: string): Either<string, string> =>
  !existsSync(path.resolve(filePath))
    ? left(`Error: file not exist. ${filePath}`)
    : right(filePath);


export const loadCardRequest: LoadCardRequest =
  flatMap(path => pipe(
    readFileSync(path, 'utf-8'),
    (content) => content.split(/\r?\n/),
    filter(line => line.trim() !== ''),
    (lines) => lines.length === 0
      ? left('Error: File has not content')
      : right(lines)
  ))

export const filterApprove: FilterApprove =
  flatMap(timeStamps =>
    pipe(
      timeStamps,
      mapCard,
      approveResult,
      filterApproved,
    )
  )

const mapCard = (timeStampList: string[]): CardRequest[] =>
  timeStampList.reduce(
    (acc, line) => processLine(acc, line), [] as CardRequest[]
  )

const processLine = (acc: CardRequest[], line: string): CardRequest[] => {
  if (line === "name,salary,has_emp_cer") return [];
  const cardRequests = line.split(',')
  if (cardRequests[0] !== '' && cardRequests[1] !== '' && cardRequests[2] !== '') {
    return appendCardRequest(acc, cardRequests)
  }
  return []
}

const appendCardRequest = (cardRequest: CardRequest[], line: string[]): CardRequest[] =>
  [...cardRequest, {
    name: line[0],
    salary: Number(line[1]),
    hasEmpCert: line[2] === "true",
  }]



const approveResult = (cards: CardRequest[]): Either<string, ApprovalResult[]> =>
  pipe(
    cards,
    mapCardInRange,
    (cardApprove) => !cardApprove ?
      left(`Error: Found unknown reject`) :
      right(cardApprove)
  )


const mapCardInRange = (timeStampList: CardRequest[]): ApprovalResult[] =>
  timeStampList.reduce(
    (acc, line) => [...acc, cardInRange(line)], [] as ApprovalResult[]
  )

const cardInRange = (card: CardRequest): ApprovalResult => {
  let cardType = cardCriteria.filter(cardCri => (cardCri.minSalary <= card.salary && cardCri.maxSalary >= card.salary) || card.salary >= cardCri.minSalary)
  if (cardType.length > 0) {
    cardType = cardType.filter(c => (c.requiredEmpCert && card.hasEmpCert) || !c.requiredEmpCert)
  }
  return {
    ...card,
    cardType: cardType[cardType.length - 1]?.cardType
  }
}

const filterApproved = (cards: Either<string, ApprovalResult[]>): Either<string, ApprovalResult[]> =>
  pipe
    (cards._tag === 'Right' ? cards.right : [],
      filterCard,
      (cardApprove) => cardApprove.length <= 0 ?
        left(`Error: Found unknown reject`) :
        right(cardApprove)

    )

const filterCard = (c: ApprovalResult[]): ApprovalResult[] =>
  c.filter(cc => cc.cardType)

export const filterReject: FilterReject =
  flatMap(timeStamps =>
    pipe(
      timeStamps,
      mapCard,
      approveResult,
      filterRejected
    )
  )

const filterRejected = (cards: Either<string, ApprovalResult[]>): Either<string, CardRequest[]> =>
  pipe
    (cards._tag === 'Right' ? cards.right : [],
      filterRejectCard,
      (cardApprove) => !cardApprove ?
        left(`Error: Found unknown reject`) :
        right(cardApprove)

    )
const filterRejectCard = (c: ApprovalResult[]): ApprovalResult[] =>
  c.filter(cc => !cc.cardType)