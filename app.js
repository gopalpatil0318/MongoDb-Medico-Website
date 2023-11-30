const bodyParser = require("body-parser");
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

const MONGO_URL = process.env.MONGO_URL;

mongoose.connect(MONGO_URL).then(() => {
    console.log("DB Connected");
}).catch(() => {
    console.log("Error while connecting DB");
});

const supplierSchema = new mongoose.Schema({
    sname: String,
    smail: String,
    scontact: String,
    saddress: String
});

const Supplier = mongoose.model("supplier", supplierSchema); 

const medicineSchema = new mongoose.Schema({
    medicine_name: String,
    packing: String,
    generic_name: String,
    supplier: String,
});


const Medicine = mongoose.model("medicine", medicineSchema);

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/addMedicine", async function (req, res) {
    try {
        const suppliers = await Supplier.find(); // Change here
        res.render("addMedicine", { suppliers });
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/addMedicine", async (req, res) => {
    const medicine_name = req.body.medicine_name;
    const packing = req.body.packing;
    const generic_name = req.body.generic_name;
    const supplierName = req.body.supplier; // Get supplier name

    try {
        const newMedicine = new Medicine({
            medicine_name: medicine_name,
            packing: packing,
            generic_name: generic_name,
            supplier: supplierName, // Store supplier name
        });

        await newMedicine.save();
        console.log("Medicine added successfully");
        res.redirect("/");
    } catch (error) {
        console.error("Error adding medicine:", error);
        res.status(500).send("Internal Server Error");
    }
});




app.get("/manageMedicine", async (req, res) => {
    try {
        const medicines = await Medicine.find().populate("supplier", "sname");

        res.render("manageMedicine", { medicines: medicines });
    } catch (error) {
        console.error("Error fetching medicines:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.post("/deleteMedicine", async (req, res) => {
    const medicineId = req.body.medicineId;

    try {
        const deletedMedicine = await Medicine.findOneAndDelete({ _id: medicineId });

        if (!deletedMedicine) {
            console.log("Medicine not found");
            return res.status(404).send("Medicine not found");
        }

        console.log("Medicine deleted successfully");
        res.redirect("/manageMedicine"); // Redirect to the medicine management page
    } catch (error) {
        console.error("Error deleting medicine:", error);
        res.status(500).send("Internal Server Error");
    }
});







app.get("/addSupplier", (req, res) => {
    res.render("addSupplier");
});

app.post("/addSupplier", (req, res) => {
    const sname = req.body.sname;
    const smail = req.body.smail;
    const scontact = req.body.scontact;
    const saddress = req.body.saddress;
    console.log(scontact);
    const newSupplier = new Supplier({
        sname : sname,
        smail : smail,
        scontact : scontact,
        saddress : saddress
    });
    

    newSupplier.save().then(() => {
        console.log("Supplier Add successfully");
    }).catch(() => {
        console.log("Error in add Supplier ");
    });

    res.redirect("/manageSupplier");
});

app.get("/manageSupplier", async (req, res) => {
    try {
        const suppliers = await Supplier.find();
        res.render("manageSupplier", { suppliers: suppliers });
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        res.status(500).send("Internal Server Error");
    }
});



app.post("/deleteSupplier", async (req, res) => {
    const supplierId = req.body.supplierId;

    try {
        
        const deletedSupplier = await Supplier.findOneAndDelete({ _id: supplierId });

        if (!deletedSupplier) {
            console.log("Supplier not found");
            return res.status(404).send("Supplier not found");
        }

        console.log("Supplier deleted successfully");
        res.redirect("/manageSupplier"); 
    } catch (error) {
        console.error("Error deleting supplier:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.listen(port, () => {
    console.log(`server is running port ${port}`);
});
