//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const mongodb = require("mongodb");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb+srv://admin-obad:11357900aa..@atlascluster.70y6xtb.mongodb.net/todolistDB?retryWrites=true&w=majority');

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", async function(req, res) {
 
  async function foundAllItems() {
    try {
      const foundItems = await Item.find({}) 
      if (foundItems.length === 0) {
          async function insertDefaultItems() {
            try {
               await Item.insertMany(defaultItems);
            } catch (error) {
              console.log(error);
            }
          }

          insertDefaultItems();
          res.redirect("/");
      }  else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
       
      }
      
    } catch (error) {
      console.log(error);
    }
  }
  foundAllItems();


});

app.post("/", async function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    await item.save();
    res.redirect("/");
  } else {
    try {
      const foundList = await List.findOne({name: listName});
      foundList.items.push(item);
      await foundList.save();
      res.redirect("/" + listName);
    } catch (error) {
      console.log(error);
      res.send("An error occurred while adding the item to the list.");
    }
  }
});


app.post("/delete", async function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  try{
    if (listName === "Today") {async function deleteItem(){
    const deleteItems = await Item.findByIdAndDelete(checkedItemId);
     
        console.log("seccfully deleted");
      }
    
      deleteItem();

  res.redirect("/");
} else {
   await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
   await Item.findByIdAndDelete(checkedItemId);
     
      res.redirect("/" + listName);
}
} catch(error){
  console.log(error);
}

  
  
});

app.get("/:customListName", async function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  const listName = req.body.listName;
  try {
    const foundList = await List.findOne({name: customListName});
    const foundLists = await List.findOneAndUpdate({name: listName});
    if (foundList) {
      if(foundLists.items.length === 0) {
        async function insertDefaultItems() {
          try {
            await List.findOneAndUpdate({name: listName}, {$push: {items: defaultItems}});
            
            console.log("insert default items");
            } catch (error) {
            console.log(error);
          }
        }
        insertDefaultItems();
        res.redirect("/" + customListName);
      }else{
        console.log("List already exists in the database.");
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
      
    } else {
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      await list.save();
      res.redirect("/" + customListName);
      console.log("List created successfully.");
      
    }
    
    // 
  } catch (error) {
    console.log(error);
    res.send("An error occurred while creating the list.");
  }
  
});


app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
} 

app.listen(port, function() {
  console.log("Server started on port seccessfully");
});



