const multer=require("multer")
const path=require("path")
const cryto=require("crypto")

//diskstorage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images/uploads')
    },
    filename: function (req, file, cb) {
      cryto.randomBytes(12,function(err,name){
        const fn=name.toString("hex")+path.extname(file.originalname)
        cb(null, fn)
      })
      
    }
  })
  
  //export upload variable
  const upload = multer({ storage: storage })
  module.exports=upload


