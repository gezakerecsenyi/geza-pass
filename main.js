 /*
 _______  _______  _______  _______         _______  _______  _______  _______ 
(  ____ \(  ____ \/ ___   )(  ___  )       (  ____ )(  ___  )(  ____ \(  ____ \
| (    \/| (    \/\/   )  || (   ) |       | (    )|| (   ) || (    \/| (    \/
| |      | (__        /   )| (___) | _____ | (____)|| (___) || (_____ | (_____ 
| | ____ |  __)      /   / |  ___  |(_____)|  _____)|  ___  |(_____  )(_____  )
| | \_  )| (        /   /  | (   ) |       | (      | (   ) |      ) |      ) |
| (___) || (____/\ /   (_/\| )   ( |       | )      | )   ( |/\____) |/\____) |
(_______)(_______/(_______/|/     \|       |/       |/     \|\_______)\_______)

Geza Kerecsenyi 2018. Share under Creative Commons Attribution-NonCommercial 4.0 International License.
*/

//Definitions of common streaks (patterns) of numbers, sorted by frequency and complexity (tier 1 is least complex)
var tier1 = ["123","234","345","456","567","789","890","0987654321","1234","2345","3456","0987","4567","5678","6789","7890","246","2468","1234567890","321","432","543","654","765","987","098","12","10","11","22","33","44","55","66","77","88","99","00"];

var tier2 = ["4321","5432","6543","7654","8765","9876","642","8642","210","54321","65432","76543","87654","98765","09876","654321","765432","7531","876543","08642","987654","963","098765","8765432","9876543210","9876543","0987654","87654321","09876543","531","852","012","0123","12345","23456","34567","45678","56789","67890","123456","234567","0246","0369","1357","345678","24680","456789","357","369","567890","2345678","0123456789","024","3456789","4567890","12345678","23456789","34567890","135","258","987654321","098765432"];

var tier3 = ["630","9753","741","123456789","234567890","01234","02468","036","048","124","3579","147","468","470","6420","9630","3210","753","420","98765432","062","086","0864"];

var tier4 = ["97531","543210","876543210","76543210","951","6543210","43210","86420","975","260","864","074","840","421","012345","012345678","01234567","159","0123456","579","680","4680","13579","1248","248"];

var words, text, wordPos, pwords;

//---------------------------------------------------------------SETUP------------------------------------------------------------------

//Weightings
var a = 1; //Lowercase letters
var b = 1.4; //Numbers
var c = 1.3; //Uppercase letters
var d = 1.9; //Special characters
var e = 1.7; //Other characters

//List of words setup
var di = "https://raw.githubusercontent.com/dwyl/english-words/master/words.txt"; //Your choice of list of words
var did = "\n"; //The delimiter between the words
var olm = 1; //The mode to control the overlap. 0 is more punitive, while 1 is less strict. e.g if we had a password 'hellorry21', that contains words 'hell', 'hello' and 'lorry'. 'Hell' is ignored, since it is just part of a bigger word (deactivate this in 'features' if you wish). With mode 0, we subtract from the score for both 'hello' and 'lorry'. With mode 1, we only subtract for 'hello'.

//Common passwords setup
var cred = "https://raw.githubusercontent.com/danielmiessler/SecLists/master/Passwords/Common-Credentials/10-million-password-list-top-10000.txt" //Your list of common passwords
var credd = "\n"; //The delimiter between the passwords
var tc = 10000; //Amount of passwords to penalise from 'cred'
var wc = 1000; //Amount of 'awful' passwords to prohibit from 'cred'

//Set thresholds and actions for password complexity levels
var categories = [
  {max:0, action:function(score){ //Use this format to create unlimited categories of password complexities
    alert("Awful or commonly used");
  }},
  {max:4, action:function(score){
    alert("1/4 - unacceptable");
  }},
  {max:7, action:function(score){
    alert("2/4 - needs more special characters"); //This, for instance, would apply to any password with a score between 4 and 7
  }},
  {max:10.5, action:function(score){
    alert("3/4 - good! The minimum complexion.");
  }},
  {max:Infinity, action:function(score){ //Use max:Infinity to do anything above the highest option.
    alert("Great; of a very decent quality, complexion and length.");
  }}
];

//======================================================================================================================================

var oReq = new XMLHttpRequest();
oReq.onreadystatechange = function(){
  if(this.readyState === 4 && this.status === 200){
    words = this.responseText.split(did);
  }
};
oReq.open("GET", di, true);
oReq.send();

var reqPword = new XMLHttpRequest();
reqPword.onreadystatechange = function(){
  if(this.readyState === 4 && this.status === 200){
    pwords = this.responseText.split(credd);
  }
};
reqPword.open("GET", cred, true);
reqPword.send();

function score(p){
  //Get base score ('Best case scenario') to subract from - a weighted sum of all characters
  var score = p.split(/[a-z]/g).length*a + p.split(/[0-9]/g).length*b + p.split(/[A-Z]/g).length*c + (p.split(/[ -/]/g).length + p.split(/[\:-@]/g).length)*d + (p.length - (p.split(/[a-z]/g).length + p.split(/[0-9]/g).length + p.split(/[A-Z]/g).length + p.split(/[ -/]/g).length + p.split(/[\:-@]/g).length))*e;


  //Penalise common 'streaks' of numbers (e.g '123')

  //Find all streaks
  var numStreak = false;
  var streaks = [];
  for (i=0;i<p.length;i++){
    if (!(numStreak||isNaN(p[i]))){
      numStreak = true;
      thisStreak = "";
    }
    if (isNaN(p[i])){
      if (numStreak){
        streaks.push(thisStreak);
      }
      numStreak = false;
    }
    if (numStreak){
      thisStreak += p[i];
    }
  }
  if (numStreak) var endStreak = thisStreak;
  //Penalise streaks
  for (i=0;i<streaks.length;i++){
    if (streaks[i].length===1){
      continue;
    }
    if (tier1.indexOf(streaks[i])>-1){
      score -= streaks[i].length;
    }
    if (tier2.indexOf(streaks[i])>-1){
      score -= streaks[i].length/2;
    }
    if (tier3.indexOf(streaks[i])>-1){
      score -= streaks[i].length/3;
    }
    if (tier4.indexOf(streaks[i])>-1){
      score -= streaks[i].length/4;
    }
  }
  //Penalise streaks at the end more, since they are more common
  if (endStreak != undefined){
    if (tier1.indexOf(endStreak)>-1){
      score -= endStreak.length + 1.5
    }
    if (tier2.indexOf(endStreak)>-1){
      score -= endStreak.length
    }
    if (tier3.indexOf(endStreak)>-1){
      score -= endStreak.length / 2
    }
    if (tier4.indexOf(endStreak)>-1){
      score -= endStreak.length / 3
    }
  }

  //Penalise words

  var ret = 0;
  wordPos = [];

  //Find all words
  for (i=0;i<words.length;i++){
    if (words[i].length > 3){
      var index = p.toLowerCase().indexOf(words[i].toLowerCase());
      if(index>-1){
        wordPos.push({
          word:words[i],
          spans:[]
        });
        for (r=index;r<index+words[i].length;r++){
          wordPos.slice(-1)[0].spans.push(r);
        }
      }
    } else {
      continue;
    }
  }
  wordPos.sort(function(a,b){
    if (b.word.length - a.word.length !== 0){
      return b.word.length - a.word.length;
    } else {
      return a.spans[0] - b.spans[0];
    }
  });
  //Ensure overlapping words don't get doubley penalised (e.g 'welcome' contains also contains 'come', but we only want to penalise 'welcome'.)
  for (i=0;i<wordPos.length;i++){
    for (q=i+1;q<wordPos.length;q++){
      var found;
      if (olm === 0){
        var found = wordPos[q].spans.every(r => wordPos[i].spans.indexOf(r) >= 0);
      } else {
        var found = wordPos[i].spans.some(r => wordPos[q].spans.indexOf(r) >= 0);
      }
      if (found){
        if (wordPos[i].spans.length < wordPos[q].spans.length){
          wordPos.splice(i,1);
          i--;
        } else {
          wordPos.splice(q,1);
          q--;
        }
      }
    }
  }

  //Penalise
  for (i=0;i<wordPos.length;i++){
    score -= Math.log(Math.log10(wordPos[i].word.length)*(wordPos[i].word.length))*2.5;
  }

  //Penalise common passwords
  if (pwords.indexOf(p)>-1){
    if (pwords.indexOf(p)>wc){
      score -= Math.log2((tc+2)-pwords.indexOf(p))/2.5;
    } else {
      score = 0;
    }
  }
 
  categories.sort(function(a,b){
    return a.max - b.max;
  });
 
  for (i=0;i<categories.length;i++){
    if (score > categories[i].max){
      continue;
    } else {
      categories[i].action(score);
      break;
    }
  }
}
