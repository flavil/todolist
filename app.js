const express = require("express");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static("public"));

app.set('view engine', 'ejs');

mongoose.connect("mongodb+srv://flavialonghi:CFzbLtsB6NMeRRWJ@cluster0.m6lxgky.mongodb.net/?retryWrites=true&w=majority");

const workItems = [];

const itemSchema = new mongoose.Schema({
    name: String
});

const Item = new mongoose.model("Item", itemSchema);

const item1 = new Item({
    name: "Welcome to your to do list"
});

const item2 = new Item({
    name: "Buy food"
});

const item3 = new Item({
    name: "clean house"
});

const defaultItems = [item1, item2, item3];

async function insertManyItems(data) {
    try {
        await Item.insertMany(defaultItems);
    } catch (error) {
        console.log(error);
    }  
}

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
});

const List = new mongoose.model("List", listSchema);


app.get("/", function(req, res) {
    // const day = date.getDate();
    Item.find().then(function(foundItems) {
        if (foundItems.length === 0) {
            insertManyItems(defaultItems);
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today",
                newItems: foundItems
            });
        }
    });
});

app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name: customListName}).then(function(foundList) {
        if (!foundList) {
            const list = new List({
                name: customListName,
                items: defaultItems
            });
            list.save();
            res.redirect("/" + customListName);
        } else {
      
            res.render("list", {
                listTitle: foundList.name,
                newItems: foundList.items
            });
        }
    });

});

app.post("/", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const newItem = new Item({
        name: itemName
    });
    if (listName === "Today") {
        newItem.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}).then(function(foundList) {
            foundList.items.push(newItem);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

app.post("/work", function(req, res) {
    const item = req.body.newItem;
    workItems.push(item);
    res.redirect("/");
});

app.get("/about", function(req, res) {
    res.render("about");
});

app.post("/delete", function(req, res) {
    const checkedItemId = req.body.itemId;
    const listName = req.body.listName;
    if (listName === "Today") {
        Item.findByIdAndRemove(req.body.itemId).then(function(err) {
            res.redirect("/");
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull : {items: {_id: checkedItemId}}}).then(function(output) {
            res.redirect("/" + listName);
        });

    }
});

app.listen(3000, function() {
    console.log("Server listening on port 3000");
});