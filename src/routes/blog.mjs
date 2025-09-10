import { Router } from "express";
const router = Router()
import { PrismaClient } from "@prisma/client"
import { checkAuthAdmin, checkAuthBoss, checkAuthUser } from "../utils/authValid.mjs";
const prisma = new PrismaClient();

router.post("/api/blog/tag/add", checkAuthAdmin, async (req, res) => {
    try {
        let { name } = req.body
        await prisma.blogTag.create({ data: { name } })
        res.status(201).send("")
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.delete('/api/admin/blog/delete/:id', checkAuthBoss, async (req, res) => {
    try {
        const { id } = req.params
        const data = await prisma.blog.delete({ where: { id: id } })
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.post("/api/blog/add", checkAuthAdmin, async (req, res) => {
    try {
        let data = req.body
        await prisma.blog.create({ data })
        res.status(201).send()
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.put("/api/blog/edit", checkAuthAdmin, async (req, res) => {
    try {
        let data = req.body
        await prisma.blog.update({ where: { id: data.id }, data })
        res.status(200).send()
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.get('/api/blog/tag/all', checkAuthAdmin, async (req, res) => {
    try {
        const data = await prisma.blogTag.findMany()

        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get('/api/blog/tag/blogs/:id', async (req, res) => {
    try {
        const { id } = req.params
        const data = await prisma.blogTag.findFirst({ where: { id }, include: { blog: true } })
        res.status(200).send(data?.blog)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.get('/api/blog/byId/:id', async (req, res) => {
    try {
        const { id } = req.params
        const data = await prisma.blog.findFirst({ where: { id }, include: { tag: { include: { blog: true } } } })
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get('/api/blog/all', async (req, res) => {
    try {
        const { query } = req.query
        const data = await prisma.blog.findMany({
            where: {
                title: {
                    contains: query ? String(query) : undefined, // Case-sensitive search
                },
            }
        })
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

export default router