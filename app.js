//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// mongoose DB control
mongoose.connect("mongodb+srv://admin-yoon:seokjoong8966@cluster0-urhdc.mongodb.net/todolistDB", {useUnifiedTopology:true});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todo list!"
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
};

const List = mongoose.model("List", listSchema);


// app logics

const day = date.getDate();

app.get("/", function(req, res) {

  Item.find(function(err, foundItems){
    if(err){
      console.log(err);
    } else {
      if(foundItems.length === 0){
        Item.insertMany(defaultItems, function(err){
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully added default items!");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {listTitle: day, newListItems: foundItems});
      }
    } 
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if(listName === day){
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name:listName}, function(err, foundList){
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/"+listName);
    });
  }
  
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === day){
    Item.deleteOne({_id: checkedItemId }, function(err){
      if(err){
        console.log(err);
      } else {
        console.log("Deletion Succeed!")
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id:checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    })
  }

  
});

app.get("/:custom", function(req, res){
  const customListName = _.capitalize(req.params.custom);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        // List Does Not Exist
        const list = new List({
          name: customListName,
          items: defaultItems
        });
      
        list.save();
        res.redirect("/"+customListName);
      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

  
});

app.get("/about", function(req, res){
  res.render("about");
});


// Server
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server Has Started Successfully!");
});
