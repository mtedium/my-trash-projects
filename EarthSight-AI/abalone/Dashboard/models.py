from django.db import models

# Create your models here.

class User(models.Model):
    time = models.DateTimeField(blank=True, null=True)
    username = models.CharField(max_length=20, blank=True, null=True,unique=True)
    password = models.CharField(max_length=255, blank=True, null=True)
    money = models.CharField(max_length=255, blank=True, null=True)
    role = models.IntegerField(blank=True, null=True)
    name = models.CharField(max_length=20, blank=True, null=True)
    flag = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'user'


class Abalone(models.Model):
    sex = models.CharField(max_length=255, blank=True, null=True)
    length = models.CharField(max_length=255, blank=True, null=True)
    diameter = models.CharField(max_length=255, blank=True, null=True)
    height = models.CharField(max_length=255, blank=True, null=True)
    whole_weight = models.CharField(max_length=255, blank=True, null=True)
    shucked_weight = models.CharField(max_length=255, blank=True, null=True)
    viscera_weight = models.CharField(max_length=255, blank=True, null=True)
    shell_weight = models.CharField(max_length=255, blank=True, null=True)
    rings = models.CharField(max_length=255, blank=True, null=True)
    username = models.ForeignKey('User', models.DO_NOTHING, db_column='username',to_field="username",
     blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'abalone'


class Record(models.Model):
    username = models.ForeignKey('User', models.DO_NOTHING, db_column='username',to_field="username",blank=True, null=True)
    data = models.CharField(max_length=255, blank=True, null=True)
    pred = models.CharField(max_length=255, blank=True, null=True)
    model = models.CharField(max_length=255, blank=True, null=True)
    time = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'record'

class Modelinfo(models.Model):
    time = models.DateTimeField()
    model = models.CharField(max_length=255, blank=True, null=True)
    mae = models.CharField(max_length=255, blank=True, null=True)
    mse = models.CharField(max_length=255, blank=True, null=True)
    rmse = models.CharField(max_length=255, blank=True, null=True)
    r2 = models.CharField(max_length=255, blank=True, null=True)
    datasize = models.FloatField(blank=True, null=True)
    traintime = models.CharField(max_length=255, blank=True, null=True)
    username = models.ForeignKey('User', models.DO_NOTHING, db_column='username',to_field="username", blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'modelinfo'
