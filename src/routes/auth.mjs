import { Router } from "express";
import jwt, { decode } from 'jsonwebtoken';
import { jwtSecret } from "../../app.mjs";
const router = Router()
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient();
import Kavenegar, { KavenegarApi } from 'kavenegar';
// import sendOtp from "../utils/otp.mjs";
import crypto from "crypto"
import { SendEmail } from '../utils/email.mjs'
import { ComparePassword, HashPassword } from "../utils/helper.mjs";
import { checkAuthUser } from "../utils/authValid.mjs";
import { decrypt, encrypt } from "../utils/crypto.mjs";
import { SendSms } from "../utils/sendSms.mjs";

const generateOtp = () => {
    return crypto.randomInt(1000, 9999).toString();
}
let otpStore = {}
router.get('/api/auth/getCode/:phoneNumber', async (req, res) => {

    try {
        const { phoneNumber } = req.params;


        if (!phoneNumber) return res.status(400).send({ success: false, msg: 'شماره تلفن وارد نشده است' });

        const otp = generateOtp();
        otpStore[phoneNumber] = { otp, expires: Date.now() + 2 * 60 * 1000 };

        await SendSms(phoneNumber, `مشترک گرامی /n کد شما :${otp}`)

        res.status(200).send(phoneNumber)

    } catch (error) {
        console.log(error)
        res.status(500).send(error);

    }
})


router.get('/api/auth/status', async (req, res) => {
    let Cdecode = await req.header("Authorization");
    Cdecode = await decode(Cdecode?.split(" ")[1])
    res.status(200).send(Cdecode)
})
router.post('/api/auth/sign', async (req, res) => {
    try {
        const body = req.body
        const code = otpStore[body.phoneNumber]?.otp
        if (body.code ==code) {
            const check = await prisma.user.findFirst({ where: { phone: body.phoneNumber } });
            // const check = await prisma.user.create({data:{phone:body.phone}})

            if (check) {
                const roles = await prisma.roles.findMany({ where: { userId: body.phoneNumber } });
                await prisma.user.update({ where: { phone: body.phoneNumber }, data: { isSeller: body.side } })
                const token = jwt.sign({ phone: body.phoneNumber, roles, side: body.side }, jwtSecret, { expiresIn: '10h' });

                check.email && await SendEmail("یک لاگین به حساب شما انجام شد", check.email, check.name || check.phone)
                const userData = {
                    data: { phone: body.phoneNumber, roles, side: body.side },
                    token
                };


                res.status(200).send(userData);


            } else {
                await prisma.user.create({ data: { phone: body.phoneNumber, isSeller: body.side,adress:null } })
                const token = jwt.sign({ phone: body.phoneNumber, roles: [], side: body.side }, jwtSecret, { expiresIn: '10h' });
                const userData = {
                    data: { phone: body.phoneNumber, roles: [], side: body.side },
                    token
                };

                res.status(201).send(userData);

            }

        } else {
            res.status(400).send("کد اشتباه است");

        }



    } catch (error) {
        console.log(error)
        res.status(500).send(error);

    }

});
router.post('/api/auth/password', async (req, res) => {
    try {
        const body =await req.body
        console.log(body)
        const check = await prisma.user.findFirst({ where: { phone: body.phoneNumber } });

        if (check?.password) {
            const match = decrypt(check.password) == body.password
            if (match) {
                const roles = await prisma.roles.findMany({ where: { userId: body.phoneNumber } });
                await prisma.user.update({ where: { phone: body.phoneNumber }, data: { isSeller: body.side } })
                const token = jwt.sign({ phone: body.phoneNumber, roles, side: body.side }, jwtSecret, { expiresIn: '10h' });
                check.email && await SendEmail("یک لاگین به حساب شما انجام شد", check.email, check.name || check.phone)

                const userData = {
                    data: { phone: body.phoneNumber, roles, side: body.side },
                    token
                };
                res.status(200).send(userData);
            } else {
                res.status(400).send("رمز شما اشتباه است");

            }
        } else {
            res.status(400).send("رمز شما اشتباه است");
        }





    } catch (error) {
        console.log(error)
        res.status(500).send(error);

    }

});


router.get('/api/user/profile', checkAuthUser, async (req, res) => {
    const user = req.user;

    const data = await prisma.user.findFirst({ where: { phone: user.phone }, select: {PercentOfReduceSendPrice:true, phone: true, name: true, email: true, walletHolder: true, walletNumber: true, password: true ,nationalCode:true,instagram:true} })
    res.status(200).send(data)
})
router.put('/api/user/profile', checkAuthUser, async (req, res) => {
    const user = req.user;
    const {
        email,
        walletHolder,
        walletNumber,
        name,
        nationalCode,social,PercentOfReduceSendPrice } = req.body;

    await prisma.user.update({ where: { phone: user.phone }, data: {PercentOfReduceSendPrice, email, walletHolder, walletNumber, name ,nationalCode:parseInt(nationalCode),instagram:social} })
    res.status(201).send("")
})
router.get('/api/user/passwordCode', checkAuthUser, async (req, res) => {

    try {
        const { phone } = req.user;

        const otp = generateOtp();
        otpStore[phone] = { otp, expires: Date.now() + 2 * 60 * 1000 };

        await SendSms(phone, `مشترک گرامی /n کد شما :${otp}`)

        res.status(200).send(phone)

    } catch (error) {
        console.log(error)
        res.status(500).send(error);

    }
})
router.put('/api/user/password', checkAuthUser, async (req, res) => {
    try {
        const user = req.user;
            const {
                Ppassword,
                Npassword } = req.body;
            const data = await prisma.user.findFirst({ where: { phone: user.phone } })

            if (data.password) {
                const dePass = decrypt(data.password)
                if (dePass == Ppassword) {

                    await prisma.user.update({ where: { phone: user.phone }, data: { password: encrypt(Npassword) } })
                    res.status(201).send("")
                }
                else {
                    res.status(400).send("رمز شما اشتباه است")
                }
            } else {

                await prisma.user.update({ where: { phone: user.phone }, data: { password: encrypt(Npassword) } })
                res.status(201).send("")
            }


        


    } catch (error) {
        console.log(error)
        res.status(500).send(error);

    }


    // 

})


router.post('/api/auth/reset', async (req, res) => {
    try {
        const body = req.body
        const code = otpStore[body.phoneNumber]?.otp
        if (body.code == code) {
            const check = await prisma.user.findFirst({ where: { phone: body.phoneNumber } });
            // const check = await prisma.user.create({data:{phone:body.phone}})
            if (check) {
                const hashed = HashPassword(body.password)
                await prisma.user.update({ where: { phone: body.phoneNumber }, data: { password: hashed } })
                check.email && await SendEmail("عملیات تغییر رمز با موفقیت انجام شد", check.email, check.name || check.phone)


                const token = jwt.sign({ phone: body.phoneNumber }, jwtSecret, { expiresIn: '10h' });
                const userData = {
                    token
                };

                res.status(200).send(userData);


            } else {
                res.status(400).send("حساب وجود ندارد");

            }

        } else {
            res.status(400).send("کد اشتباه است");

        }



    } catch (error) {
        console.log(error)
        res.status(500).send(error);

    }

});


export default router