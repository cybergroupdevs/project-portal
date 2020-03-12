const bcrypt = require('bcrypt');
const model = require("../models");
const schema = require("../schemas");
const nodemailer=require('nodemailer');
var generator = require('generate-password');
const saltRounds = 10;
var generatePassword = require('password-generator');


require('dotenv').config();
// node function which sends email to new user create
 const nodeMail=async function(output,newEmployee){
     let testAccount = await nodemailer.createTestAccount();

     // create reusable transporter object using the default SMTP transport
         let transporter = nodemailer.createTransport({
         service:'gmail',
          auth:{
           user:process.env.EMAIL,
           pass:process.env.PASSWORD
         }
      });
  // send mail with defined transport object
  let info ={
     from: '"balanideepanshu92@gmail.com"', // sender address
     to:newEmployee.email, // list of receivers
     subject: "Node Contact Request", // Subject line
     text: "Hello world?", // plain text body
     html: output // html body
   }
   transporter.sendMail(info,function(err,data){
        if(err){
          console.log("error occurs",err);
        }
        else{
          console.log("email sent successfully");
        }
   });
}
const isUnique = async function(empId, email) {
  const employeeWithEmpId = await model.employee.get({ empId });
  const employeeWithEmail = await model.employee.get({ email });

  if (employeeWithEmpId)
    return { status: false, message: "EmployeeId already exists" };
  if (employeeWithEmail)
    return { status: false, message: "Email already exists" };

  return { status: true };
};

class Employee {
  constructor() {}

  async create(req, res) {
 
    const {
      empId,
      email,
      name,
      designation,
      joining,
      phone,
      address,
      role
    } = req.body;

    const newEmployee = {
      empId,
      email,
      name,
      designation,
      joining,
      phone,
      address,
      role
    };

    var date=Date.now();
    var password = generatePassword(12, false, /\d/, 'cyg-'+(date));
    newEmployee.password = password;
    console.log(newEmployee.password,"randoom");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log(newEmployee.password,"randoom");
   newEmployee.password=hashedPassword;
  const resultAfterIsUnique = await isUnique(empId, email);
    if (!resultAfterIsUnique.status) {
      return res.status(401).send({
        success: false,
        payload: {
          message: resultAfterIsUnique.message
        }
      });
    }

    try {
      await model.employee.save(newEmployee).then(() => {
        res.status(201).send({
          success: true,
          payload: {
            message: "Employee created successfully"
          }
        });
      });
    } catch (err) {
      res.status(400).send({
        success: false,
        payload: {
          message: err.message
        }
      });
    }
    const output=`

     <p>you have a new contact request</p>
     <p>Thanks again for 
      <h3>your details</h3>
      <ul>
      <li>Name:${name}</li>
      <li>Email:${email}</li>
      <li>Designation:${designation}</li>
      <li>Role:${role}</li>
      <li>Phone:${phone}</li>
      <li>Address:${address}</li>
      <li>joining:${joining}</li>
      </ul>
      <p>This is Computer Generated Email ,Don't reply back to it</p>
      `
      nodeMail(output,newEmployee);
  }

  async index(req, res) {
    const employeeList = await model.employee.log(
      {$and:[{"_id":{$ne:"5e6338721abe492c4080f558" }},{"empId":{$ne:req.query.empId}}]},
      { name: 1, designation: 1, role: 1, email: 1, phone: 1, empId: 1 }
  );
    res.send(employeeList);
    console.log(employeeList);
  }

  async show(req, res) {
    console.log("in employee show",req.query.empId);
    const employee = await model.employee.get({ empId:req.query.empId});
    console.log(employee);
   
    if (!employee) {
      return res.status(404).send({ employee,
        message:"Employee does not exists!"
      });
    }

    res.status(200).send({
      employee,
      message:"Employee retrieved successfully"
    });
  }
  
  async update(req, res) {
    const {
      empId,
      email,
      name,
      designation,
      joining,
      phone,
      address,
      password,
      projectId,
      role
    } = req.body;


    const employeeToUpdate = await model.employee.get({ empId });
    console.log(empId, email);
    const patchedEmployee = {
      email: employeeToUpdate.email !== email ? email : undefined,
      name,
      designation,
      joining,
      phone,
      address,
      password,
      projectId,
      role
    };

    console.log(patchedEmployee);
    
    //discarding keys with undefined
    Object.keys(patchedEmployee).forEach(key => patchedEmployee[key] === undefined && delete patchedEmployee[key])

    try {
      await model.employee.update({ empId: empId }, patchedEmployee).then(() => {
        res.status(200).send({
          success: true,
          payload: {
            message: "Employee updated successfully"
          }
        });
      });
    } catch (err) {
      res.status(400).send({
        success: false,
        payload: {
          message: err.message
        }
      });
    }
  }

  async delete(req, res) {
    console.log(req.query.empId);
    const employee = await model.employee.delete({ empId: req.query.empId });
    console.log(employee);
   
    res.send({
      success: true,
      payload: {
        employee,
        message: 'Employee Deleted Successfully'
      }
    });
  }
  async searchEmployee(req, res){
   
        console.log(req.query.name);
        let query=req.query.name;
        query = query.toLowerCase().trim()
        const employees = await model.employee.getforsearch({name: { $regex:`^${query}`, $options: 'i'}},{});
        console.log("==========>>>>>>>>>>>>>", employees);
        res.status(200).send(employees);
    
    }
  
async sort(req,res)
  { console.log("in sort");
    var mysort = { name: 1 };
    const employeeList = await model.employee.log(
      {$and:[{"_id":{$ne:"5e6338721abe492c4080f558" }},{"empId":{$ne:req.query.empId}}]},
      { name: 1, designation: 1, role: 1, email: 1, phone: 1, empId: 1 }
    );
    res.send(employeeList);
  }
}
module.exports = new Employee();
