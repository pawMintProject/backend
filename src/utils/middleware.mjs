import { mockUser } from "./constanse.mjs"

export const resolveIndexByUserId = (req , res , next) => {

    const { params : {id} } = req
    const parseId = Number(id)
    if(isNaN(parseId)) return res.sendStatus(400)

    const findUserIndex = mockUser?.findIndex((user) => user.id === parseId)

    if(findUserIndex === -1) return res.sendStatus(404);

    req.findUserIndex = findUserIndex;
    // next(new Error())
    next()
}

