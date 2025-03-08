const products = require('../models/productModel');

// Create a new product
exports.createProduct = async (req, res) => {
    console.log("Inside createProduct controller", req.body);
    try {
        const { name, price, description, category, stock } = req.body;
        
        // Validate required fields
        if (!name || !price || !description || !category || !stock) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Extract and validate nutrition data
        // Extract nutrition data from form fields
        const nutrition = {
            calories: req.body['nutrition.calories'] || req.body.calories,
            sugar: req.body['nutrition.sugar'] || req.body.sugar,
            caffeine: req.body['nutrition.caffeine'] || req.body.caffeine,
            serving: req.body['nutrition.serving'] || req.body.serving
        };

        if (!nutrition.calories || !nutrition.sugar || !nutrition.caffeine || !nutrition.serving) {
            return res.status(400).json({ message: "Missing nutrition information" });
        }

        let productImg;
        // Handle both file upload and base64 image
        if (req.file) {
            productImg = req.file.filename;
        } else if (req.body.image) {
            try {
                // If base64 image is provided
                const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
                const imageBuffer = Buffer.from(base64Data, 'base64');
                const fileName = `product_${Date.now()}.png`;
                require('fs').writeFileSync(`uploads/${fileName}`, imageBuffer);
                productImg = fileName;
            } catch (error) {
                console.error("Error processing image:", error);
                return res.status(400).json({ message: "Invalid image data" });
            }
        } else {
            return res.status(400).json({ message: "Product image is required" });
        }

        // Check if product already exists
        const existingProduct = await products.findOne({ name });
        if (existingProduct) {
            return res.status(406).json({ message: "Product already exists in our collection. Please try another one!" });
        }

        // Create new product
        const newProduct = new products({
            name,
            price,
            description,
            category,
            stock,
            image: productImg,
            nutrition
        });

        // Save product to database
        await newProduct.save();

        res.status(201).json({
            message: 'Product created successfully',
            product: newProduct
        });
    } catch (error) {
        console.log("error Inside createProduct controller:", error);
        res.status(500).json({ message: 'Error creating product', error: error.message });
    }
};

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const allProducts = await products.find();
        res.status(200).json(allProducts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
    try {
        const product = await products.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product', error: error.message });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    console.log("Inside updateProduct controller", req.body);
    const { id } = req.params;

    try {
        const name = req.body.name;
        const price = req.body.price;
        const description = req.body.description;
        const category = req.body.category;
        const stock = req.body.stock;
        
        console.log("Extracted fields:", { name, price, description, category, stock });
        
        // Validate required fields
        if (!name || !price || !description || !category || !stock) {
            console.log("Missing required fields:", { name, price, description, category, stock });
            return res.status(400).json({ 
                message: "Missing required fields",
                details: {
                    name: !name ? "Name is required" : null,
                    price: !price ? "Price is required" : null,
                    description: !description ? "Description is required" : null,
                    category: !category ? "Category is required" : null,
                    stock: !stock ? "Stock is required" : null
                }
            });
        }

        // Extract and validate nutrition data
        // Extract nutrition data from form fields
        const nutrition = {
            calories: req.body['nutrition.calories'] || req.body.calories,
            sugar: req.body['nutrition.sugar'] || req.body.sugar,
            caffeine: req.body['nutrition.caffeine'] || req.body.caffeine,
            serving: req.body['nutrition.serving'] || req.body.serving
        };
        console.log("Nutrition data:", nutrition);

        if (!nutrition.calories || !nutrition.sugar || !nutrition.caffeine || !nutrition.serving) {
            console.log("Missing nutrition information:", nutrition);
            return res.status(400).json({ 
                message: "Missing nutrition information",
                details: {
                    calories: !nutrition.calories ? "Calories information is required" : null,
                    sugar: !nutrition.sugar ? "Sugar information is required" : null,
                    caffeine: !nutrition.caffeine ? "Caffeine information is required" : null,
                    serving: !nutrition.serving ? "Serving size information is required" : null
                }
            });
        }

        // Check if product exists
        const existingProduct = await products.findById(id);
        console.log("Existing product:", existingProduct);
        if (!existingProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let productImg = existingProduct.image; // Default to existing image
        console.log("Initial productImg:", productImg);

        // Handle image update
        if (req.file) {
            productImg = req.file.filename;
            console.log("Updated image from file:", productImg);
        } else if (req.body.image && req.body.image !== existingProduct.image) {
            try {
                // If base64 image is provided
                const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
                const imageBuffer = Buffer.from(base64Data, 'base64');
                const fileName = `product_${Date.now()}.png`;
                require('fs').writeFileSync(`uploads/${fileName}`, imageBuffer);
                productImg = fileName;
                console.log("Updated image from base64:", productImg);
            } catch (error) {
                console.error("Error processing image:", error);
                return res.status(400).json({ message: "Invalid image data" });
            }
        }

        const updateData = {
            name,
            price: parseFloat(price),
            description,
            category,
            stock: parseInt(stock),
            image: productImg,
            nutrition
        };
        console.log("Update data:", updateData);

        const updatedProduct = await products.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        console.log("Updated product result:", updatedProduct);

        res.status(200).json({
            message: 'Product updated successfully',
            product: updatedProduct
        });
    } catch (error) {
        console.error("Error Inside updateProduct controller:", error);
        res.status(500).json({ message: 'Error updating product', error: error.message });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await products.findByIdAndDelete(req.params.id);
        
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({
            message: 'Product deleted successfully',
            product: deletedProduct
        });
    } catch (error) {
        console.log("error Inside deleteProduct controller");
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const products = await products.find({ category });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products by category', error: error.message });
    }
};

// Get preview products for non-users
exports.getPreviewProducts = async (req, res) => {
    try {
        // Fetch a limited number of products (e.g., 8 products)
        const previewProducts = await products.find()
            .select('name price image category description') // Select only necessary fields
            .limit(8)
            .sort({ createdAt: -1 }); // Get the most recent products

        res.status(200).json(previewProducts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching preview products', error: error.message });
    }
};