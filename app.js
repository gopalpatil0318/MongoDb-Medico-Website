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



const customerSchema = new mongoose.Schema({
    customer_name: {
        type: String,
        required: true,
    },
    contact_number: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    doct_name: String,
    doct_add: String,
});

const Customer = mongoose.model('Customer', customerSchema);

const invoiceSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    totalDiscount: {
        type: Number,
        required: true,
    },
    netTotal: {
        type: Number,
        required: true,
    },
});

const Invoice = mongoose.model('Invoice', invoiceSchema);




app.get('/', async (req, res) => {
    try {
        const totalCustomers = await Customer.countDocuments();
        const totalSuppliers = await Supplier.countDocuments();
        const totalMedicines = await Medicine.countDocuments();
        const outOfStockMedicines = await MedicineStock.countDocuments({ quantity: { $lt: 1 } });
        const expiredMedicines = await MedicineStock.countDocuments({ expirationDate: { $lt: new Date() } });
        const totalInvoices = await Invoice.countDocuments();

        const currentDate = new Date(new Date().toLocaleDateString());

        console.log('Current Date:', currentDate);

        // Calculate total amount for today's sales
        const todaysSalesResult = await Invoice.aggregate([
            {
                $match: {
                    date: { $gte: currentDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$netTotal" }
                }
            }
        ]);

        console.log('Todays Sales Result:', todaysSalesResult);

        const todaysSales = todaysSalesResult.length > 0 ? todaysSalesResult[0].totalAmount : 0;

        // Calculate total amount for today's purchases
        const todaysPurchasesResult = await Purchase.aggregate([
            {
                $match: {
                    purchaseDate: { $gte: currentDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$totalAmount" }
                }
            }
        ]);

        console.log('Todays Purchases Result:', todaysPurchasesResult);

        const todaysPurchases = todaysPurchasesResult.length > 0 ? todaysPurchasesResult[0].totalAmount : 0;

        res.render('index', {
            totalCustomers,
            totalSuppliers,
            totalMedicines,
            outOfStockMedicines,
            expiredMedicines,
            totalInvoices,
            todaysSales,
            todaysPurchases,
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});






app.get("/addMedicine", async function (req, res) {
    try {
        const suppliers = await Supplier.find();
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

app.post('/deleteMedicine', async (req, res) => {
    const medicineId = req.body.medicineId;

    try {
       
        const result = await MedicineStock.findByIdAndDelete(medicineId);

        if (!result) {
           
            return res.status(404).send('Medicine not found');
        }

        res.redirect('/manageMedicineStock'); 
    } catch (error) {
        console.error('Error deleting medicine:', error);
        res.status(500).send('Internal Server Error');
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
        res.redirect("/manageMedicine");
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



app.get('/api/getGenericName', async (req, res) => {
    const selectedMedicine = req.query.medicine;

    try {
        
        const medicine = await Medicine.findOne({ medicine_name: selectedMedicine });
        
        if (medicine) {
            res.json({ genericName: medicine.generic_name });
        } else {
            res.status(404).json({ error: 'Medicine not found' });
        }
    } catch (error) {
        console.error('Error fetching Generic Name:', error);
        res.status(500).json({ error: 'Internal Server Error' });
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


app.get('/addCustomer', (req, res) => {
    res.render('addCustomer');
});

app.post('/addCustomer', async (req, res) => {
    try {
        const { customer_name, contact_number, address, doct_name, doct_add } = req.body;

        
        const customer = new Customer({
            customer_name,
            contact_number,
            address,
            doct_name,
            doct_add,
        });

        
        await customer.save();

        res.redirect('/manageCustomer');
    } catch (error) {
        console.error('Error adding customer:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/manageCustomer', async (req, res) => {
    try {
        
        const customers = await Customer.find();

        
        res.render('manageCustomer', { customers });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.post("/deleteCustomer", async (req, res) => {
    const customerId = req.body.customerId;

    try {
        const deletedCustomer = await Customer.findOneAndDelete({ _id: customerId });

        if (!deletedCustomer) {
            console.log("Customer not found");
            return res.status(404).send("Customer not found");
        }

        console.log("Customer deleted successfully");
        res.redirect("/manageCustomer"); 
    } catch (error) {
        console.error("Error deleting customer:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.get('/newInvoice', async (req, res) => {
    try {
        
        const defaultCustomer = await Customer.find();
        const defaultMedicine = await MedicineStock.find();

        
        res.render('newInvoice', {
            defaultCustomer: defaultCustomer,
            defaultMedicine: defaultMedicine,
        });
    } catch (error) {
        console.error('Error fetching default customer and medicine:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/api/getCustomerInfo', async (req, res) => {
    const customerName = req.query.customer;

    try {
        const customerInfo = await Customer.findOne({ customer_name: customerName });
        
        if (customerInfo) {
            res.json({
                address: customerInfo.address,
                contact_no: customerInfo.contact_number
            });
        } else {
            res.status(404).json({ error: 'Customer not found' });
        }
    } catch (error) {
        console.error('Error fetching customer information:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});





app.get('/api/getMedicineInfo', async (req, res) => {
    const medicineId = req.query.medicine;

    try {
        const medicineInfo = await MedicineStock.findOne({ _id: medicineId });
        res.json(medicineInfo);
    } catch (error) {
        console.error('Error fetching medicine information:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




app.post('/newInvoice', async (req, res) => {
    try {
        console.log('Received data:', req.body);
        const {
            customer_name,
            date,
            total_amount,
            total_discount,
            net_total,
            quantity,
            medicineId,
        } = req.body;

        const newInvoice = new Invoice({
            customerName: customer_name,
            date: new Date(date),
            totalAmount: total_amount,
            totalDiscount: total_discount,
            netTotal: net_total,
           
        });

       
        await newInvoice.save();

        
        try {
            
            const medicineStock = await MedicineStock.findOne({ _id: medicineId });

    
            if (medicineStock) {
                medicineStock.quantity -= quantity;
               
                await medicineStock.save();
            } else {
                console.error(`Medicine stock not found for ${medicineId}`);
               
            }
        } catch (error) {
            console.error('Error updating medicine stock:', error);
            
            throw error;
        }

       

        console.log('Invoice added successfully');
        res.redirect('/');
    } catch (error) {
        console.error('Error adding invoice:', error);
        res.status(500).send('Internal Server Error');
    }
});





app.get('/manageInvoice', async (req, res) => {
    try {
      
      const invoices = await Invoice.find();
  
     
      res.render('manageInvoice', { invoices });
    } catch (error) {
      console.error('Error fetching invoice data:', error);
    
      res.status(500).send('Internal Server Error');
    }
  });



app.post("/deleteInvoice", async (req, res) => {
    const invoiceId = req.body.invoiceId;

    try {
        const deletedInvoice = await Invoice.findOneAndDelete({ _id: invoiceId });

        if (!deletedInvoice) {
            console.log("Invoice not found");
            return res.status(404).send("Invoice not found");
        }

        console.log("Invoice deleted successfully");
        res.redirect("/manageInvoice"); 
    } catch (error) {
        console.error("Error deleting invoice:", error);
        res.status(500).send("Internal Server Error");
    }
});



app.listen(port, () => {
    console.log(`server is running port ${port}`);
});
