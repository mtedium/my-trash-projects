"""abalone URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path,include,re_path
from django.shortcuts import render,HttpResponse

from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve

def helloABC(request):
    html = """
    <h1>Hello World </h1>
    <h4 style="color:#ff0000" > Python</h4>
    """
    return HttpResponse(html)

def firstPage(request):
    return render(request,'first.html',
        {"user":"小明","school":"上海第二工业大学"})


urlpatterns = [
    path("hello.html",helloABC),
    path("first.html",firstPage),

    path('Dashboard/', include('Dashboard.urls')),
    path('User/', include('User.urls')),
    path('Medicine/', include('Medicine.urls')),

    re_path(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT}, name='static'),

]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)