export async function POST(req:Request){

const data = await req.json()

const scriptURL =
"https://script.google.com/macros/s/AKfycbxw6kqPgI31dwnYChFFRAbqdcJO4RtZj7i3ELN3qH0-MAaD72icnQ2XpU3Zwt2Vv6NH/exec"

await fetch(scriptURL,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(data)
})

return Response.json({success:true})

}