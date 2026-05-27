from django.shortcuts import render
from django.http import JsonResponse,HttpResponseRedirect
from .models import Video
import pymysql
from django.views.decorators.csrf import csrf_exempt

# Create your views here.
def indexJs(request):
    if request.method =="GET":
        if "cate1" not in request.GET or "cate2" not in request.GET:
            return HttpResponseRedirect("/Medicine/indexJs.html?cate1=五官科&cate2=中耳炎")
        
        videoData = Video.objects.filter(
            cate1 = request.GET["cate1"],
            cate2 = request.GET["cate2"],
        )
        return render(request,'medicineJs.html',{"videoData":videoData})

headers = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    "Access-Control-Allow-Origin": "*"
}

@csrf_exempt
def cateApi(request):
    data = Video.objects.values("cate1","cate2").distinct()
    print(data)
    cateData = {}
    for t in data:
        if t["cate1"] not in cateData:
            cateData[t["cate1"]]= []
        cateData[t["cate1"]].append(t["cate2"])

    return JsonResponse(cateData,headers= headers)

def videoApi(request):
    data = Video.objects.filter(
            cate1 = request.GET["cate1"],
            cate2 = request.GET["cate2"],
    )
    videoData = []
  
    for t in data:
        videoData.append({
            "time":t.time,
            "video":t.video,
            "duration":t.duration,
            "doctor":t.doctor,
            "zan":t.zan,
            "hospital":t.hospital,
            "count":t.count,
            "id":t.id,

        })
    return JsonResponse({"videoData":videoData},headers= headers)
    
def introApi(request):
    data = {
        "intro":Video.objects.get(id= request.GET["id"]).intro,
    }
    return JsonResponse(data,headers=headers)


def indexAjax(request):
    return render(request,"medicineAjax.html")

def indexVue(request):
    return render(request,"medicineVue.html")

def indexElement(request):
    return render(request,"medicineElement.html")


@csrf_exempt
def cateApi2(request):
    data = Video.objects.values("cate1","cate2").distinct()
   
    cateData = {}
    for t in data:
        if t["cate1"] not in cateData:
            cateData[t["cate1"]]= []
        cateData[t["cate1"]].append(t["cate2"])

    options = []

    for k,v in cateData.items():
        options.append({
            "value":k,
            "label":k,
            "children":[{"value":t,"label":t} for t in v]
        })


    return JsonResponse({"options":options},headers= headers)



    
        


    



