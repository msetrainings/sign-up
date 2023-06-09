const express = require("express")
const request = require("request")
const https = require("https")
const app = express()
const port = 3000
const apiKey = process.env.MAILCHIMP_API_KEY
const audienceId = process.env.MAILCHIMP_AUDIENCE_ID

app.use(express.static("public"));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs');

app.get("/", (req, res) => {
    let file = __dirname + "/public/signup.html"
    res.sendFile(file)
})

app.post("/", (req,res) => {
    const firstname = req.body.firstname
    const lastname = req.body.lastname
    const email = req.body.email
    // see mailchimp api reference for data
    const data = {
        members: [
            {
                email_address: email,
                status: "subscribed",
                merge_fields: {
                    FNAME: firstname,
                    LNAME: lastname
                }
            }
        ]
    }
    const jsonData = JSON.stringify(data)
    const url = `https://us17.api.mailchimp.com/3.0/lists/${audienceId}`
    const options = {
        method: "POST",
        auth: `mse_training:${apiKey}`
    }

    const request = https.request(url, options, function(response) {

        response.on("data", function(data) {
            let results = JSON.parse(data)
            let responseData = {}
            let errorMsg = ""
            if (results.error_count == 1) {
                if (results.errors[0].error_code === "ERROR_CONTACT_EXISTS") {
                    errorMsg = `${results.errors[0].email_address} is already a list member`
                } else {
                    errorMsg = results.errors[0].error
                }
                console.error("Error: " + errorMsg)
                responseData = {
                    message: "Error: Failed to subscribe",
                    details: `${errorMsg}`
                }
            }
            else if (results.total_created == 1 ) {
                let status = results.new_members[0].status
                let address = results.new_members[0].email_address
                console.log(status, address)
                responseData = {
                    message: "Successfully subscribed",
                    details: `${address} successfully registred`
                }
            }
            res.render("response", {tplData: responseData})
        })
    })
    request.write(jsonData)
    request.end()

})

/*
app.post("/failure", (req, res) => {
    res.redirect("/")
})

app.post("/success", (req, res) => {
    res.redirect("/")
})
*/

app.listen(port, () => {
    console.log(`Server is listening on Port ${port}`)
})
