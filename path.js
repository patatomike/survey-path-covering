import classifyPoint from "robust-point-in-polygon";

// MD 4.02.21 : testing with various polygons
var rectangle = [[4, 3], [4, 9], [21, 9], [21, 3]]; // MD 29.01.21 : fonctionne avec un rectangle;
var polygonConvexe4Edges1 = [[4, 3], [4, 9], [21, 12], [21, 3]];
var polygonConvexe4Edges2 = [[4, 3], [7, 9], [15, 8], [21, 4]];
var polygonConvexe7Edges = [[4, 3], [7, 9], [15, 8], [18, 7], [20, 5], [17, 1], [11, 0]];
var polygonConvexe6Edges = [[11, 0], [4, 3], [10, 9], [18, 7], [20, 5], [17, 1]];
var polygonTestLatLong = [ [6.707115583440958, 46.499117434292884],
                            [6.707376489249354, 46.49914942396374],
                            [6.707713441756837, 46.499188966824],
                            [6.7076973922130705, 46.499442044414884],
                            [6.707078693490166, 46.49942956069875],
                            [6.707115583440958, 46.499117434292884]];


//                          var polygonTestLatLong = [[670711, 4649911],
  //                                                  [670737, 4649914],
    //                                                [670771, 4649918],
      //                                              [670769, 4649944],
        //                                            [670707, 4649942],
          //                                          [670711, 4649911]];



var polygon = polygonTestLatLong;

var angle80 = 80;
var angle0 = 60;
var angle = angle0;
var distanceBetweenLines = convertMeterToLatLong(2);
//var distanceBetweenLines = 2;

var maxPerimeter;
//var wiggleRoom = 0.01;
var wiggleRoom = 0.000001;

var polygonCenter = {x:0, y:0};
var nbrOfTransects;

var intersections = [];




function run() {
  var result;
  var refTransect;
  var transects;

  // #1 build a perimeter around your polygon to ensure it find intersections
  maxPerimeter =  buildPerimeter(polygon, wiggleRoom);

  // #2 create a reference transect that will go through the center of your polygon at the correct angle
  refTransect =   generateReferenceTransect (polygonCenter, angle);

  // #3 generate a number of transects that will interesect with your polygon
  transects =     generateTransects(refTransect, distanceBetweenLines, angle);

  // #4 build a path with all the intersections between your polygon and the transects
  result =        buildPath(polygon,transects);

  document.getElementById("myText").innerHTML = result;
}

function convertMeterToLatLong(distanceM){
  var distanceLatLong;

  distanceLatLong = (0.0001 / 1.11) * distanceM;
  //distanceLatLong = (10 / 1.11) * distanceM;
  console.log("dist lat long : "+distanceLatLong);

  return distanceLatLong
}

function intersectionsEdgeTransect (edge, transect){
  var tempIntersection = [];
  tempIntersection = math.intersect(edge[0], edge[1], transect[0], transect[1]);

  console.log("edge");
  console.log(edge);
  console.log("transect");
  console.log(transect);
  console.log("temp intersection : "+tempIntersection);
  console.log(maxPerimeter);
  if(tempIntersection != null){
    if (classifyPoint(maxPerimeter, tempIntersection) < 1 ){
      console.log("inside");
      if (!pointAlreadyExist(tempIntersection)){
        intersections.push(tempIntersection);
      }
    }else{
      console.log("outside");
    }
  }

}

// MD : 04.02.21 : evitez les doublons
function pointAlreadyExist(point){
for (var i = 0; i <  intersections.length; i++) {
   if(intersections[i][0] == point[0] && intersections[i][1] == point[1]){
     return true;
   }
}
return false;
}

function buildPath (polygon, transects){

  for (var i = 0; i < transects.length; i++) {
    console.log("i : " + i);

    // 29.01.21 MD : if a transect is even, we check the bottom edge first, then go anti-clockwise
    if (i % 2 == 0){
      for (var j = polygon.length; j > 0 ;j--) {
        console.log("j : " + j);
        var edge = [];
        if (j == polygon.length){
          edge = [polygon[0], polygon[polygon.length - 1]];
        }
        else{
          console.log("j > 1");
          edge = [polygon[j], polygon[j-1]];
        }
        console.log("Edge : "+ edge);

        intersectionsEdgeTransect(edge, transects[i]);
      }
    }
    // 29.01.21 MD : if a transect is odd, we check the top edge first, and then the bottom one
    else {

      for (var j = 0; j < polygon.length ;j++) {
        console.log("j : " + j);
        var edge = [];
        if (j < polygon.length - 1){
          edge = [polygon[j], polygon[j+1]];
        } else {
          edge = [polygon[j], polygon[0]];
        }

        intersectionsEdgeTransect(edge, transects[i]);
      }
    }
  }
  console.log("Path : ");
  console.log(intersections);
  return intersections;
}



function generateReferenceTransect (entryPoint, angle){


  // MD 28.01.21 : on cherche une droite passant par le point d'entrée du polygon et d'une angle spécifique
  var randomP1 = {x:0, y:0};
  var randomP2 = {x:0, y:0};
  var transect = [];

  randomP1.x = entryPoint.x + ( -(distanceBetweenLines * 3) * math.cos(angle * (math.pi/180)));
  randomP1.y = entryPoint.y + ( -(distanceBetweenLines * 3) * math.sin(angle * (math.pi/180)));
  randomP2.x = entryPoint.x + ( (distanceBetweenLines * 3) * math.cos(angle * (math.pi/180)));
  randomP2.y = entryPoint.y + ( (distanceBetweenLines * 3) * math.sin(angle * (math.pi/180)));

  transect.push([randomP1.x, randomP1.y], [randomP2.x, randomP2.y]);
  console.log(transect);
  return transect;
}

// MD : 13.02.21 new transects building function (the old one is not correct)
function generateTransects(refTransect, distBetweenLines, refAngle){
  var tempTransectP1 = {x:0, y:0};
  var tempTransectP2 = {x:0, y:0};
  var transects = [];

  //MD : 13.02.21 find the perpendicular angle to the first transect (used to find the distance between transect)
  var perpendicularAngle = ((refAngle-90) * (math.pi/180));
  var tempDistance = distBetweenLines;

  //MD : 13.02.21 test value

  console.log("Ref angle : "+ refAngle * (math.pi/180));
  console.log("Perp angle : "+perpendicularAngle);
  console.log("nbr of transects : "+ nbrOfTransects);
  // MD : 13.02.21 : test with entryPoint on the top left corner of the polygon
  tempDistance = -(distBetweenLines * ((nbrOfTransects-1)/2));

  for (var i = 0; i < nbrOfTransects; i++) {

    var tempTransect = [];

    tempTransectP1.x = refTransect[0][0] + (tempDistance * math.cos(perpendicularAngle));
    tempTransectP1.y = refTransect[0][1] + (tempDistance * math.sin(perpendicularAngle));
    tempTransectP2.x = refTransect[1][0] + (tempDistance * math.cos(perpendicularAngle));
    tempTransectP2.y = refTransect[1][1] + (tempDistance * math.sin(perpendicularAngle));

    transects[i] = [[tempTransectP1.x, tempTransectP1.y], [tempTransectP2.x, tempTransectP2.y]];


    tempDistance = tempDistance+distBetweenLines;

  }
  console.log("transects");
  console.log(transects);
  return transects;

}


// MD : 04.02.21 : build a slightly bigger permimeter to make the algorithm
function buildPerimeter (polygon, wiggleRoom){
  var y_axis = {min:0, max:0};
  var x_axis = {min:0, max:0};
  var y_values = [];
  var x_values = [];
  var distance = {x:0, y:0};
  var tempPerimeter = [];

  for (var i = 0; i < polygon.length; i++) {
    x_values.push(polygon[i][0]);
    y_values.push(polygon[i][1]);
  }

  x_axis.min = math.min(x_values);
  x_axis.max = math.max(x_values);

  y_axis.min = math.min(y_values);
  y_axis.max = math.max(y_values);

  polygonCenter.x = (x_axis.min + x_axis.max) / 2;
  polygonCenter.y = (y_axis.min + y_axis.max) / 2;

  // MD : 13.02.21 find the max number of transect that could touch a
  distance.x = x_axis.max - x_axis.min;
  distance.y = y_axis.max - y_axis.min;

  if(distance.x > distance.y){
    nbrOfTransects = Math.round(distance.x / distanceBetweenLines);
  } else{
    nbrOfTransects = Math.round(distance.y / distanceBetweenLines);
  }

  if (nbrOfTransects % 2 == 0){
    nbrOfTransects += 1;
  }

  for (var i = 0; i < polygon.length; i++) {
    var tempVetrex = [];
    if (((x_axis.min + x_axis.max) / 2) > polygon[i][0]) {
      tempVetrex[0] = polygon[i][0]-wiggleRoom;
    } else {
      tempVetrex[0] = polygon[i][0]+wiggleRoom;
    }
    if (((y_axis.min + y_axis.max) / 2) > polygon[i][1]) {
      tempVetrex[1] = polygon[i][1]-wiggleRoom;
    } else {
      tempVetrex[1] = polygon[i][1]+wiggleRoom;
    }
    tempPerimeter.push(tempVetrex);
  }
  return tempPerimeter;

}

run();
