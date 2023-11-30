const bodyParser = require("body-parser");
const express = require("express");
const methodOverride = require('method-override');
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(methodOverride('_method'));

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

const purchaseSchema = new mongoose.Schema({
    supplierName: String,
    invoiceNumber: String,
    paymentType: String,
    purchaseDate: Date,
    totalAmount: Number,
});

const Purchase = mongoose.model("purchase", purchaseSchema);

const medicineStockSchema = new mongoose.Schema({
    medicineName: String,
    packing: String,
    genericName: String,
    batchId: String,
    expirationDate: Date,
    supplier: String,
    quantity: Number,
    mrp: Number,
    rate: Number,
    amount: Number,
});

const MedicineStock = mongoose.model("medicine_stock", medicineStockSchema);






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
        res.redirect("/manageMedicine");
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




app.get("/manageMedicineStock", async (req, res) => {
    try {
        const medicineStocks = await MedicineStock.find();
        res.render("manageMedicineStock", { medicineStocks });
    } catch (error) {
        console.error("Error fetching medicine stocks:", error);
        res.status(500).send("Internal Server Error");
    }
});




app.get("/outOfStock", async (req, res) => {
    try {
        const outOfStockMedicines = await MedicineStock.find({ quantity: 0 });
        res.render("outOfStock", { medicineStocks: outOfStockMedicines });
    } catch (error) {
        console.error("Error fetching out-of-stock medicines:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.get("/expiredMedicine", async (req, res) => {
    try {
        const expiredMedicines = await MedicineStock.find({ expirationDate: { $lt: new Date() } });
        res.render("expiredMedicine", { expiredMedicines });
    } catch (error) {
        console.error("Error fetching expired medicines:", error);
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




app.get("/addPurchase", async (req, res) => {
    try {
        const suppliers = await Supplier.find();
        const medicines = await Medicine.find();

        res.render("addPurchase", { suppliers, medicines });
    } catch (error) {
        console.error("Error fetching suppliers and medicines:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.post("/addPurchase", async (req, res) => {
    const supplierName = req.body.supplier;
    const invoiceNumber = req.body.inv_no;
    const paymentType = req.body.pay_type;
    const purchaseDate = req.body.date;

    const medicineName = req.body.medicine_name;
    const packing = req.body.packing;
    const genericName = req.body.generic_name; 
    const batchId = req.body.batch_id;
    const expirationDate = new Date(req.body.date1);
    const quantity = req.body.quantity;
    const mrp = req.body.mrp;
    const rate = req.body.rate;
    const amount = req.body.amount;
    const grand_total = req.body.grand_total;

    try {
        const medicineStock = new MedicineStock({
            medicineName,
            packing,
            genericName,
            batchId,
            expirationDate,
            supplier: supplierName,
            quantity,
            mrp,
            rate,
            amount,
        });

        await medicineStock.save();

        const purchase = new Purchase({
            supplierName,
            invoiceNumber,
            paymentType,
            purchaseDate,
            totalAmount: grand_total,
        });

        await purchase.save();

        console.log("Data added successfully");
        res.redirect("/managePurchase");
    } catch (error) {
        console.error("Error adding data:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.get("/managePurchase", async (req, res) => {
    try {
       
        const purchases = await Purchase.find();

        res.render("managePurchase", { purchases });
    } catch (error) {
        console.error("Error fetching purchases:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.delete('/deletePurchase/:id', async (req, res) => {
    const purchaseId = req.params.id;

    try {
        
        const deletedPurchase = await Purchase.findByIdAndDelete(purchaseId);

        if (!deletedPurchase) {
            console.log('Purchase not found');
            return res.status(404).send('Purchase not found');
        }


        console.log('Purchase deleted successfully');
        res.redirect('/managePurchase'); 
    } catch (error) {
        console.error('Error deleting purchase:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.listen(port, () => {
    console.log(`server is running port ${port}`);
});
