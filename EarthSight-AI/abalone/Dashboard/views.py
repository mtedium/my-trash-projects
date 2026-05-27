from django.shortcuts import render,HttpResponse
import pymysql
import matplotlib.pyplot as plt
import time
from abalone.settings import *
from Dashboard.models import *


from sklearn import neighbors
from sklearn import linear_model,metrics
from sklearn.metrics import accuracy_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeRegressor
from sklearn import svm,ensemble
import xgboost as xgb
import numpy as np
import joblib
import json



from django.http import JsonResponse
headers = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    "Access-Control-Allow-Origin": "*"
}


# Create your views here.

def sqlSelect(sql):
    conn=pymysql.connect(host='localhost',port=3306,user='root',passwd='123456',db='abalone')
    cur = conn.cursor()
    cur.execute(sql)
    sqlData=cur.fetchall()
    cur.close()
    conn.close()
    return sqlData

def sqlWrite(sql):
    conn=pymysql.connect(host='localhost',port=3306,user='root',passwd='123456',db='abalone')
    cur = conn.cursor()
    cur.execute(sql)
    cur.close()
    conn.commit()
    conn.close()
    return

def search(request):
    if request.method=="GET":
        id = request.GET.get("id","145") #?id=145
        sql = "select * from abalone where id='%s'"%(id)
        sqlData = sqlSelect(sql)
        return render(request,'search.html',{"data":sqlData})
    else:
        id = request.POST.get("inputId","145") #?id=145
        sql = "select * from abalone where id='%s'"%(id)
        sqlData = sqlSelect(sql)
        return render(request,'search.html',{"data":sqlData})



def dataSQL(request):        
    sql = """select sex,length,diameter,height,whole_weight,shucked_weight,
         viscera_weight,shell_weight,rings,user.name
         from abalone,user
         where abalone.username=user.username
         limit 15"""
    sqlData = sqlSelect(sql)
    return render(request,'dataSQL.html',{"data":sqlData})


def dataORM(request):
    notice = ""
    if request.method=="POST":
        if "addBtn" in request.POST:
            Abalone.objects.create(
                sex = request.POST["sex"],
                length = request.POST["length"],
                diameter = request.POST["diameter"],
                height = request.POST["height"],
                whole_weight = request.POST["whole_weight"],
                shucked_weight = request.POST["shucked_weight"],
                viscera_weight = request.POST["viscera_weight"],
                shell_weight = request.POST["shell_weight"],
                rings = request.POST["rings"],
                username = User.objects.get(username='admin')
            )
            notice = "添加成功"

        elif "deleteBtn" in request.POST:
            Abalone.objects.get(id = request.POST["deleteId"]).delete()
            notice = "删除成功" 

        elif "updateBtn" in request.POST:
            fList = ["sex","length","diameter","height","whole_weight",
            "shucked_weight","viscera_weight","shell_weight","rings"]
            data = {}
            for t in fList:
                data[t] = request.POST[t]
            Abalone.objects.filter(id = request.POST["updateId"]).update(**data)
            notice = "修改成功"   
            # **data 等价于 .update(sex = data["sex"],length=data["length"],...)

        elif "trainBtn" in request.POST:
            modelName = request.POST.get("model","lr")
            modelDict = {
                "lr":linear_model.LinearRegression(),
                "svr":svm.SVR(kernel="rbf"),
                "lasso":linear_model.Lasso(),
                "ridge":linear_model.Ridge(alpha=0.1),
                "dt":DecisionTreeRegressor(),
                "rf":ensemble.RandomForestRegressor(),
                "xgboost":xgb.XGBRegressor(),
                
            }
            sql="select sex,length,diameter,height,whole_weight,shucked_weight,viscera_weight,shell_weight,rings from abalone "
            sqlData = sqlSelect(sql)
            
            dataX = np.array(sqlData)[:,0:-1]
            dataY = np.array(sqlData)[:,-1]

            # 划分数据集
            train_x, test_x, train_y, test_y = train_test_split(dataX, dataY, test_size=0.2)

        
            model = modelDict[modelName]
            
            start_time = time.time() # 获取当前时间，作为训练开始时间
            model.fit(train_x, train_y) # 训练模型
            end_time = time.time() # 获取当前时间，作为训练结束时间
            #保存模型
            joblib.dump(model, "./static/model/%s.model"%modelName, protocol=2)

            # 预测并评价模型
            pred = model.predict(test_x)
            mae = metrics.mean_absolute_error(test_y, pred)
            mse = metrics.mean_squared_error(test_y, pred)
            rmse = metrics.mean_squared_error(test_y, pred, squared=False)
            r2 = metrics.r2_score(test_y, pred)
            lens=len(dataX)
            train_time=end_time - start_time
            modelInfo = [mae,mse,rmse,r2,lens,train_time,model]

            ormData = Abalone.objects.filter()[0:15]

          

            Modelinfo.objects.create(
                model=modelName,mae=mae,mse=mse,rmse=rmse,r2=r2,datasize=lens,traintime=str(train_time),
                username = User.objects.get(username=request.session["username"]),
            )
            return render(request,'dataORM.html',{"data":ormData,"modelInfo":modelInfo})

        else:  #筛选
            ormData = Abalone.objects.filter(
                sex = request.POST.get("sex"),
                rings = request.POST.get("rings"),
            )

            return render(request,'dataORM.html',{"data":ormData,"notice":notice})


    ormData = Abalone.objects.filter()[0:15]
    return render(request,'dataORM.html',{"data":ormData,"notice":notice})


def graph(request):
    sql = "select rings,count(*) from abalone group by rings order by CONVERT(rings,SIGNED) "
    sqlData2 = sqlSelect(sql)
    x = [t[0] for t in sqlData2]
    y = [t[1] for t in sqlData2]
    plt.figure(figsize=(10,5))
    plt.bar(x,y)
    fname = "%s.png"%(int(time.time()))
    plt.savefig(MEDIA_ROOT+'/'+fname)

    return render(request,'graph.html',{"fname":fname,"x":x,"y":y})

def graphApi(request):
    data = []
    tmp = Abalone.objects.filter(height__lt = 1.0)
    for t in tmp:
        data.append([t.height,t.rings])
    return JsonResponse({"scatter":data},headers=headers)



def pred(request):
    if request.method=="GET":
        data = ['1','0.455','0.365','0.095','0.514','0.2245','0.101','0.15']
        return render(request,"pred.html",{"data":data,"agePred":"???"})
    else:
        data = [
            float(request.POST.get("f1")),
            float(request.POST.get("f2")),
            float(request.POST.get("f3")),
            float(request.POST.get("f4")),
            float(request.POST.get("f5")),
            float(request.POST.get("f6")),
            float(request.POST.get("f7")),
            float(request.POST.get("f8")),
        ]

        modelName = request.POST.get("model","lr")
        model = joblib.load(STATIC_ROOT+"/model/%s.model"%(modelName))
        agePred = model.predict([data])[0]

        Record.objects.create(
            username = User.objects.get(username=request.session["username"]),
            model = modelName,
            data = json.dumps(data),
            pred = agePred,
        )
        return render(request,"pred.html",{"data":data,"agePred":agePred})


def record(request):
    trainData = Modelinfo.objects.all()
    predData = Record.objects.all()
    return render(request,'record.html',{"trainData":trainData,"predData":predData})



def screen(request):
    return render(request,'screen.html')



def index(request):
    return HttpResponse("""
        <h1>Hello</h1>
        <p style="color:#ff0000">Python<p>
    """)


def hello(request):
    return render(request,'firstPage.html',{"user":"小明","school":"上海第二工业大学"})
