# Password-reset email (RM20616 A10 unit 10, R2)

Firebase Authentication sends Makan's password-reset email. These files are the body it sends, built from the approved board `si-fp-4`. The email is English for everyone (Devon, 24 Nov 2026): Firebase keeps one reset template per project, with no per-language body.

| Field | Value |
| --- | --- |
| Sender name | `Makan` |
| Subject | `Reset your Makan password` |
| Body | one of the two files below |

## Files

- `reset-password.html` is layout A, the first choice. It has the orange band with the logo, the clip picture, the heading, the line with the reader's address in bold, the orange "Reset password" button and the footer line.
- `reset-password-c.html` is layout C, the fallback. It is the same email without the clip picture. Use it if a test send shows the clip picture removed or broken.

Both files use tables and inline styles only, with a system font stack. They load two pictures from the live website:

- `https://www.makanofficial.com/email/makan-logo-white.png` (the logo, alt text "Makan"), in both layouts.
- `https://www.makanofficial.com/auth-action/saved.png` (the still of the saved clip, alt text empty), in layout A only.

Firebase replaces `%EMAIL%` with the reader's address and `%LINK%` with the reset link. Each appears exactly once. `%LINK%` is the button's only link. `scripts/reset-email-template.test.mjs` checks these rules.

## Setting the template

The Identity Toolkit Admin API takes the template in the project config. The request body has this shape, with `body` set to the full text of one HTML file:

```json
{
  "notification": {
    "sendEmail": {
      "resetPasswordTemplate": {
        "senderDisplayName": "Makan",
        "subject": "Reset your Makan password",
        "body": "<the full text of reset-password.html>",
        "bodyFormat": "HTML"
      }
    }
  }
}
```

Send it as `PATCH .../v2/projects/<project>/config` with this update mask:

```
notification.sendEmail.resetPasswordTemplate.senderDisplayName,notification.sendEmail.resetPasswordTemplate.subject,notification.sendEmail.resetPasswordTemplate.body,notification.sendEmail.resetPasswordTemplate.bodyFormat
```

Name the four fields in the mask rather than `notification.sendEmail.resetPasswordTemplate` alone. A mask on the whole template replaces it, and that would clear the fields this body leaves out, such as the reply-to address and the sender's local part.

To build the request body from a file:

```sh
node -e 'const fs=require("fs");const f=process.argv[1];process.stdout.write(JSON.stringify({notification:{sendEmail:{resetPasswordTemplate:{senderDisplayName:"Makan",subject:"Reset your Makan password",body:fs.readFileSync(f,"utf8"),bodyFormat:"HTML"}}}}))' docs/email/reset-password.html
```

Record the current template before changing it, so the same request can put it back.
