let request = require("request");
let cheerio = require("cheerio");
let fs = require("fs");
const { Console } = require("console");
const { jsPDF } = require("jspdf");
let $;
let data = {};

request("https://github.com/topics", getTopicPage);

function getTopicPage(err, res, body) {
  if (!err) {
    $ = cheerio.load(body);
    let allTopicAnchors = $(
      ".no-underline.d-flex.flex-column.flex-justify-center"
    );
    //links of three topics

    let allTopicName = $(
      ".f3.lh-condensed.text-center.Link--primary.mb-0.mt-1"
    );
    //names of three topics

    for (let i = 0; i < allTopicAnchors.length; i++) {
      getAllProjects(
        "https://github.com/" + $(allTopicAnchors[i]).attr("href"),
        $(allTopicName[i]).text().trim()
      );
      //to get all projects in the each of the 3 topic pages
      fs.mkdirSync($(allTopicName[i]).text().trim());
    }
  }
}

//parameters are url of a topic, and its name
function getAllProjects(url, name) {
  request(url, function (err, res, body) {
    $ = cheerio.load(body);
    let allProjects = $(".f3.color-text-secondary.text-normal.lh-condensed .text-bold");
    //all the projects
    if(allProjects.length >8){
      allProjects = allProjects.slice(0,8);
    }//top 8 projects

    for(let i = 0; i<allProjects.length; i++){
      let projectUrl = "https://github.com/" + $(allProjects[i]).attr("href");
      //link of a project in allProjects
      let projectName = $(allProjects[i]).text().trim();
      //name of project in allProjects

      //if there is no topic name key in data object, create it and add an array of objects in its value
      //the objects contain keys-projectname and projecturl
      if(!data[name]){
        data[name] = [{projectName, projectUrl}];
      }else{
        data[name].push({projectName, projectUrl});
      }

      //to get all issues of all 8 projects of all three topics-- in data
      getIssues(projectUrl, projectName, name);
      
    }
  });
}
    
function getIssues(url, projectName, topicName){
  request(url+"/issues",function(err, res, body){
    $ = cheerio.load(body);
    let allIssues = $(".Link--primary.v-align-middle.no-underline.h4.js-navigation-open.markdown-title");
    for(let i = 0; i<allIssues.length; i++){
      let IssueTitle = $(allIssues[i]).text().trim();
      let IssueUrl = "https://github.com/" + $(allIssues[i]).attr("href");

      //index of projectname in an object in an array (of objects of projects) in data object's React key.... data={React:[{Name: , url: },{},{}...]}
      let indx = data[topicName].findIndex(function(e){
        return e.projectName == projectName;
      });
      
      if(!data[topicName][indx].issues){
        data[topicName][indx].issues = [{IssueTitle, IssueUrl}];
        //we can write the above line as
        //data[topicName][indx]["issues"] = [{IssueTitle, IssuesUrl}];
      }else{
        data[topicName][indx].issues.push({IssueTitle, IssueUrl});
      }
      //fs.writeFileSync("data.json",JSON.stringify(data)); 
      pdfgenerator();
    }
        
  });
}

function pdfgenerator(){
  for(x in data){
    let tArr = data[x];
    for(y in tArr){
      let pName = tArr[y].projectName;
      if(fs.existsSync(`${x}/${pName}.pdf`))
        fs.unlinkSync(`${x}/${pName}.pdf`);
      const doc = new jsPDF();
      for(z in tArr[y].issues){
        doc.text(tArr[y].issues[z].IssueTitle, 10,10+15*z);
        doc.text(tArr[y].issues[z].IssueUrl, 10,15+15*z);
      }
      doc.save(`${x}/${pName}.pdf`);
      //above line can also be written as:
      //doc.save(x+"/"+pName+".pdf");
      //the dollar variable in the above line is in the syntax of doc,save
      //it is not the same dollar sign we have used for loaded html in the whole project
    }
  }
}
