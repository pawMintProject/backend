import { Router } from "express";
const router = Router()
import { PrismaClient } from "@prisma/client"
import { checkAuthAdmin, checkAuthBoss, checkAuthUser, checkBlockUsers } from "../../utils/authValid.mjs";
import { jwtSecret } from "../../../app.mjs";
const prisma = new PrismaClient();
import jwt, { decode } from 'jsonwebtoken';
router.get('/api/admin/user/all', checkAuthAdmin, async (req, res) => {
    try {
        const { query } = req.query
        const data = await prisma.user.findMany({
            include: { roles: true },
            where: {
                phone: {
                    contains: query ? String(query) : undefined, // Case-sensitive search
                },
            }
        })
        res.status(200).send(data)
    }
    catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get('/api/admin/user/Blockall', checkAuthAdmin, async (req, res) => {
    try {
        const { query } = req.query
        const data = await prisma.blockUser.findMany({
            include: { user: true },
            where: {
                phone: {
                    contains: query ? String(query) : undefined, // Case-sensitive search
                },
            }
        })
        res.status(200).send(data)
    }
    catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})


router.delete('/api/admin/user/delete/:id', checkAuthAdmin, async (req, res) => {
    try {
        const { id } = req.params
        await prisma.user.delete({
            where: {
                phone: id
            }
        })
        res.status(200).send("")
    }
    catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.post('/api/admin/user/block/:id', checkAuthAdmin, async (req, res) => {
    try {

        const { id } = req.params
        await prisma.blockUser.create({ data: { phone: id } })
        await checkBlockUsers()
        res.status(201).send("")
    }
    catch (error) {
        console.log(error)
        res.status(500).send(error);

    }
})

router.get('/api/admin/user/data/:id', checkAuthAdmin, async (req, res) => {
    try {

        const { id } = req.params
        const data = await prisma.user.findFirst({ where: { phone: id } })
        res.status(200).send(data)
    }
    catch (error) {
        console.log(error)
        res.status(500).send(error);

    }
})
router.patch('/api/admin/user/addMoney/:id/:price', checkAuthAdmin, async (req, res) => {
    try {

        const { id, price } = req.params
        const data = await prisma.user.findFirst({ where: { phone: id } })
        await prisma.user.update({ where: { phone: id }, data: { money: (parseInt(data.money) + parseInt(price)).toString() } })
        res.status(201).send()
    }
    catch (error) {
        console.log(error)
        res.status(500).send(error);

    }
})
router.patch('/api/admin/user/DeMoney/:id/:price', checkAuthAdmin, async (req, res) => {
    try {

        const { id, price } = req.params
        const data = await prisma.user.findFirst({ where: { phone: id } })
        await prisma.user.update({ where: { phone: id }, data: { money: (parseInt(data.money) - parseInt(price)).toString() } })
        res.status(201).send()
    }
    catch (error) {
        console.log(error)
        res.status(500).send(error);

    }
})

router.patch('/api/admin/user/login/:id', checkAuthAdmin, async (req, res) => {
    try {

        const { id } = req.params
        const data = await prisma.user.findFirst({ where: { phone: id },include:{roles:true} })
        const token = jwt.sign({ phone: id, roles:data.roles, side: data.isSeller }, jwtSecret, { expiresIn: '10h' });
        res.status(201).send(token)
    }
    catch (error) {
        console.log(error)
        res.status(500).send(error);

    }
})

export default router