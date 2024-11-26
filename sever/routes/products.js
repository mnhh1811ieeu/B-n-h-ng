const express = require('express');
const { Product } = require("../models/products.js");
const { Category } = require("../models/category.js");
const router = express.Router();
const pLimit = require('p-limit');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs=require("fs");
var imagesArr = [];
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads");
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`);

    },
})
const upload = multer({ storage: storage })
router.post(`/upload`, upload.array("images"), async (req, res) => {
    imagesArr = [];
    const files = req.files;
    for (let i = 0; i < files.length; i++) {
        imagesArr.push(files[i].filename);
    }
    // console.log(imagesArr);
    res.json({images:imagesArr});
});

// Lấy danh sách tất cả sản phẩm
router.get(`/`, async (req, res) => {

    const productList = await Product.find().populate("category");

    if (!productList) {
        res.status(500).json({ success: false })
    }
    res.send(productList);

});
router.post(`/create`, async (req, res) => {


    const category = await Category.findById(req.body.category);
    if (!category) {
        return res.status(404).send("Danh mục không tồn tại");
    }

    // const limit = pLimit(2);
    // const imagesToUpload = req.body.images.map((image) => {
    //     return limit(async () => {
    //         const result = await cloudinary.uploader.upload(image);
    //         //console.log(`succesful`)
    //         //console.log(`result 1 24:14`)
    //         return result;
    //     }
    //     )
    // }
    // );
    // const uploadStatus = await Promise.all(imagesToUpload);
    // const imgurl = uploadStatus.map((item) => {
    //     return item.secure_url
    // })
    // if (!uploadStatus) {
    //     return res.status(500).json({
    //         error: "images cannot upload",
    //         status: false
    //     }

    //     )
   // }

    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        images: imagesArr,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        oldPrice:req.body.oldPrice,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        // numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    });
    product = await product.save();
    if (!product) {
        res.status(500).json({
            error: err,
            success: false
        })
    }
    res.status(201).json(product)
});
router.delete(`/:id`, async (req, res) => {
    const product=await Product.findById(req.params.id);
    const images= product.images;
    if(images.length!==0){
        for (image of images){
            fs.unlinkSync(`uploads/${image}`);
        }
    }
    const deletProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletProduct) {
        return res.status(404).json({
            message: 'khong thay san pham',
            status: false
        })
    } res.status(200).send({
        message: 'Da xoa san pham',
        status: true
    })
}
)
router.get('/:id', async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        res.status(500).json({
            message: 'khong co san pham voi id nay'
        })
    }
    return res.status(200).send(product);


});
router.put('/:id', async (req, res) => {
    const limit = pLimit(2);
    const imagesToUpload = req.body.images.map((image) => {
        return limit(async () => {
            const result = await cloudinary.uploader.upload(image);
            //console.log(`succesful`)
            //console.log(`result 1 24:14`)
            return result;
        }
        )
    }
    );
    const uploadStatus = await Promise.all(imagesToUpload);
    const imgurl = uploadStatus.map((item) => {
        return item.secure_url
    })
    if (!uploadStatus) {
        return res.status(500).json({
            error: "images cannot upload",
            status: false
        }

        )
    }




    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {

            name: req.body.name,
            description: req.body.description,
            images: imgurl,
            brand: req.body.brand,
            price: req.body.price,
            oldPrice: req.body.oldPrice,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            // numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,

        },
        { new: true }
    );
    if (!product) {
        res.status(404).json({
            message: 'Khong the cap nhat',
            status: false
        })
    }
    res.status(200).json({
        message: " da cap nhat",
        status: true
    })
}
);



module.exports = router;
