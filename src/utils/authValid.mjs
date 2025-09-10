import { decode } from 'jsonwebtoken'
import { HashPassword } from './helper.mjs';
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient();
let blockUsers = []
export async function checkBlockUsers() {
    const data = await prisma.blockUser.findMany();
    blockUsers = data

}
checkBlockUsers()
function checking(req, next, res, Rrole, side) {
    try {
        let Cdecode = req.header("Authorization");
        Cdecode = decode(Cdecode?.split(" ")[1])
        let role = Cdecode?.roles
        role = role?.sort((a, b) => a.role + b.role);

        role[0]?.role == undefined ? role = 0 : role = role[0]?.role
        if (Cdecode != null && role >= Rrole) {

            if (Cdecode.side == side || !side && !blockUsers.find(el => el.phone == Cdecode.phone)) {

                req.user = Cdecode
                next()
            } else {
                res.status(403).send({ success: false, message: "YOUR SIDE DOESN'T ACCESS YOU" })
            }

        } else {
            res.status(401).send({ success: false, message: "YOU NOT HAVE ACCESS IN SYSTEM" })
        }

    } catch (error) {
        res.status(401).send({ success: false, message: "YOU NOT HAVE ACCESS IN SYSTEM" })

    }

}
export const checkAuthUserBuy = async (req, res, next) => checking(req, next, res, 0)
export const checkAuthUserSell = async (req, res, next) => checking(req, next, res, 0, "sell")
export const checkAuthUser = async (req, res, next) => checking(req, next, res, 0)
export const checkAuthAdmin = async (req, res, next) => checking(req, next, res, 4)
export const checkAuthBoss = async (req, res, next) => checking(req, next, res, 7)