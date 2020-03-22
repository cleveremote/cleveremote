import * as nodemailer from 'nodemailer';

export class MailService {

    public static transporter: any = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'cleveremote.tech@gmail.com',
            pass: 'NYA0113?'
        }
    });

    /**
     * Usage:
     * sendMail is static, thus no initialization of the class is required
     * @param, {Object} mailOptions is an object of sender's detials
     * @example let mailOptions = {
     *               from: 'cleveremote.tech@gmail.com',
     *               to: 'nadime.yahyaoui.ve@gmail.com',
     *               subject: 'Sending Email using Node.js',
     *               text: 'That was easy!'
     *           };
     *
     */
    public static sendMail(mailOptions: object): void {
        MailService.transporter.sendMail(mailOptions, (error: any, info: any) => {
            if (error) {
                console.log(error);
            } else {
                console.log(`Email sent: ${info.response}`);
            }
        });
    }
}
