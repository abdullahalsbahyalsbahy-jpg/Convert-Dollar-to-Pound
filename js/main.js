
function Convertvalue(){

    var dollar = document.getElementById("dollar").value;
    var result = document.getElementById("result")

    if(dollar==""){
        result.innerHTML = 'Enter value';
    }else if (isNaN(dollar)){
        result.innerHTML = "Enter Number Not Text";
    }else if (dollar<0){
        result.innerHTML = "Enter Postive Number"
    }else if (dollar==0){
        result.innerHTML = "Enter Number Rather Than Zero";
    }else{
        result.innerHTML = dollar *50 + "   Egyption Pound";
    }

    return false;
    
}