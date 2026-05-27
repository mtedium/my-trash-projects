from django.shortcuts import render,HttpResponseRedirect
from Dashboard.models import *
import hashlib

# Create your views here.

def login(request):

    if request.method=="GET":
        request.session.clear()
        return render(request,'login.html')
    else:
        username =request.POST.get("username")
        password = request.POST.get("password")

        #计算密码的md5值
        m = hashlib.md5()
        m.update(password.encode("utf-8"))
        password = m.hexdigest()
        
        tmp = User.objects.filter(
        	username = username,
        	password = password
        )
        
        if len(tmp)==0:
        	return render(request,'login.html',{"notice":"密码错误"})
        else:
            request.session["username"] = tmp[0].username
            request.session["name"] = tmp[0].name
            request.session["role"] = tmp[0].role
            return HttpResponseRedirect('/Dashboard/search.html')