from django.utils.deprecation import MiddlewareMixin
from django.shortcuts import redirect
from django.http import JsonResponse,HttpResponseRedirect


class LoginMiddleware(MiddlewareMixin):
    def process_request(self,request):
        print(request.path)
        
        
        

        if 'login' in request.path:
            return
        
        if request.session.get("username"):
            return
        elif "videoApi2" in request.path:
            print(123)
            return JsonResponse({"notice":"<h1>账号尚未登录</h1>"})
        elif "indexElement.html" in request.path:
            return  redirect('/User/login.html?url=%s'%(request.path))
        elif "Medicine" in request.path:
            return
        else:
            return  redirect('/User/login.html?url=%s'%(request.path))
       